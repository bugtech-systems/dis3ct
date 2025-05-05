"use server";

import dbConnect from "@/lib/mongodb";
import Contact from "@/models/Contact";
import { barangays, municipalities } from "@/lib/locationData";
import mongoose from "mongoose";

export async function getElectionFilters(parNum?: string, userId?: string) {
    await dbConnect();

    const matchQuery = parNum ? {} : {};
    const userObjectId = userId ? new mongoose.Types.ObjectId(userId) : null;

    const filterFields = [
        { desc: "citymunDesc", field: "citymunCode", label: "City/Municipality", data: municipalities },
        { desc: "brgyDesc", field: "brgyCode", label: "Barangay", data: barangays },
        { field: "school", label: "School", data: null },
    ];

    const filters: any = {};

    for (const { desc, field, data } of filterFields) {
        const results = await Contact.aggregate([
            { $match: { ...matchQuery, [field]: { $ne: null } } },
            { $group: { _id: `$${field}`, count: { $sum: 1 } } },
        ]);

        filters[field] = results.sort((a, b) => b.count - a.count).map(({ _id, count }) => {
            let name = _id;
            if (data) {
                const location = data.find((item) => item[field] === _id);
                name = location ? location[desc] : _id;
            }
            return { value: _id, label: name, count };
        });
    }

    const precinctResults = await Contact.aggregate([
        { $match: { ...matchQuery, brgyCode: { $ne: null }, precinct: { $ne: null } } },
        {
            $group: {
                _id: { brgyCode: "$brgyCode", precinct: "$precinct" },
                count: { $sum: 1 },
            },
        },
    ]);

    const precinctsByBarangay: Record<string, any[]> = {};
    precinctResults.forEach(({ _id, count }) => {
        const { brgyCode, precinct } = _id;
        if (!precinctsByBarangay[brgyCode]) {
            precinctsByBarangay[brgyCode] = [];
        }
        precinctsByBarangay[brgyCode].push({ value: precinct, label: `${precinct}`, count });
    });

    filters["brgyCode"] = filters["brgyCode"].map((brgy: any) => ({
        ...brgy,
        precincts: precinctsByBarangay[brgy.value] || [],
    }));

    const tagResults = await Contact.aggregate([
        { $match: matchQuery },
        { $unwind: "$tags" },
        { $sort: { "tags.timestamp": -1 } },
        {
            $group: {
                _id: "$_id",
                latestTag: { $first: "$tags" },
            },
        },
        {
            $match: {
                "latestTag.tagType": "tag",
                "latestTag.value": { $in: ["undecided", "declined"] },
            },
        },
        {
            $group: {
                _id: { $toLower: "$latestTag.value" },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    const unknownCount = await Contact.countDocuments({
        ...matchQuery,
        tags: { $not: { $elemMatch: { tagType: "tag" } } },
    });

    const confirmCount = await Contact.countDocuments({
        ...matchQuery,
        tags: { $elemMatch: { tagType: "tag", value: "confirm" } },
    });

    const verifiedCount = await Contact.countDocuments({
        ...matchQuery,
        tags: { $elemMatch: { tagType: "tag", value: "verified" } },
    });

    filters.tags = tagResults.map(({ _id, count }) => ({
        value: _id,
        label: _id.toUpperCase(),
        count,
    }));

    if (unknownCount > 0) filters.tags.push({ value: "unknown", label: "UNKNOWN", count: unknownCount });
    if (confirmCount > 0) filters.tags.push({ value: "confirm", label: "CONFIRM", count: confirmCount });
    if (verifiedCount > 0) filters.tags.push({ value: "verified", label: "VERIFIED", count: verifiedCount });

    const mediaTagCounts = await Contact.aggregate([
        {
            $match: {
                ...matchQuery,
                tags: { $elemMatch: { tagType: { $in: ["image", "biometrics"] } } },
            },
        },
        {
            $project: {
                _id: 1,
                tagTypes: {
                    $map: {
                        input: {
                            $filter: {
                                input: "$tags",
                                as: "tag",
                                cond: { $in: ["$$tag.tagType", ["image", "biometrics"]] },
                            },
                        },
                        as: "tag",
                        in: "$$tag.tagType",
                    },
                },
            },
        },
        { $project: { tagTypes: { $setUnion: ["$tagTypes", []] } } },
        { $unwind: "$tagTypes" },
        {
            $group: {
                _id: "$tagTypes",
                count: { $sum: 1 },
            },
        },
    ]);

    filters.mediaTags = mediaTagCounts.map(({ _id, count }) => ({
        value: _id,
        label: _id.toUpperCase(),
        count,
    }));

    return filters;
}
