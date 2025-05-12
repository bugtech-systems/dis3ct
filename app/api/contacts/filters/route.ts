import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Contact from "@/models/Contact";
import { barangays, municipalities } from "@/lib/locationData";
import mongoose from "mongoose";
export const dynamic = "force-dynamic";

export async function GET(req) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const parNum = searchParams.get("parNum");
    const userId = searchParams.get("userId");

    const matchQuery = parNum ? {} : {};  // You can customize if parNum is used
    const userObjectId = userId ? new mongoose.Types.ObjectId(userId) : null;

    const filterFields = [
      { desc: "citymunDesc", field: "citymunCode", label: "City/Municipality", data: municipalities },
      { desc: "brgyDesc", field: "brgyCode", label: "Barangay", data: barangays },
      { field: "school", label: "School", data: null },
    ];

    const filters = {};

    // Generate filters for municipalities, barangays, and schools
    for (const { desc, field, label, data } of filterFields) {
      const results = await Contact.aggregate([
        { $match: { ...matchQuery, [field]: { $exists: true, $ne: null } } },
        { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      ], { allowDiskUse: true });

      filters[field] = results
        .sort((a, b) => b.count - a.count)
        .map(({ _id, count }) => {
          let name = _id;
          if (data) {
            const location = data.find((item) => item[field] === _id);
            name = location ? location[desc] : _id;
          }
          return { value: _id, label: name, count };
        });
    }

    // Group precincts under their corresponding barangays
    const precinctResults = await Contact.aggregate([
      { $match: { ...matchQuery, brgyCode: { $exists: true, $ne: null }, precinct: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: { brgyCode: "$brgyCode", precinct: "$precinct" },
          count: { $sum: 1 },
        },
      },
    ], { allowDiskUse: true });

    // Transform precinct results into a barangay-grouped structure
    const precinctsByBarangay = {};
    precinctResults.forEach(({ _id, count }) => {
      const { brgyCode, precinct } = _id;
      if (!precinctsByBarangay[brgyCode]) {
        precinctsByBarangay[brgyCode] = [];
      }
      precinctsByBarangay[brgyCode].push({ value: precinct, label: `${precinct}`, count });
    });

    // Attach precincts under corresponding barangays
    filters["brgyCode"] = filters["brgyCode"].map((brgy) => ({
      ...brgy,
      precincts: precinctsByBarangay[brgy.value] || [],
    }));

    // Count occurrences of each tag type (latest tag only)
    const tagResults = await Contact.aggregate([
      { $match: { ...matchQuery, tags: { $exists: true, $ne: [] } } },
      {
        $project: {
          latestTag: { $arrayElemAt: ["$tags", -1] },  // Get last tag (assumes chronological)
        },
      },
      {
        $match: {
          "latestTag.tagType": "tag",
          "latestTag.value": { $in: ["declined", "undecided", "confirm"] },
        },
      },
      {
        $group: {
          _id: { $toLower: "$latestTag.value" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ], { allowDiskUse: true });

    // Count records without tagType = tag
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

    const sureVote = await Contact.countDocuments({
      ...matchQuery,
      tags: { $elemMatch: { tagType: "tag", value: "sure_vote" } },
    });

    filters.tags = tagResults.map(({ _id, count }) => ({
      value: _id,
      label: _id.toUpperCase(),
      count,
    }));

    if (unknownCount > 0) {
      filters.tags.push({ value: "unknown", label: "UNKNOWN", count: unknownCount });
    }

    if (confirmCount > 0) {
      filters.tags.push({ value: "confirm", label: "CONFIRM", count: confirmCount });
    }

    if (verifiedCount > 0) {
      filters.tags.push({ value: "verified", label: "VERIFIED", count: verifiedCount });
    }

    if (sureVote > 0) {
      filters.tags.push({ value: "sure_vote", label: "SURE VOTE", count: sureVote });
    }

    // Count media tags (image / biometrics)
    const mediaTagCounts = await Contact.aggregate([
      {
        $match: {
          ...matchQuery,
          tags: { $elemMatch: { tagType: { $in: ["image", "biometrics"] } } },
        },
      },
      {
        $project: {
          tagTypes: {
            $setUnion: [
              {
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
              [],
            ],
          },
        },
      },
      { $unwind: "$tagTypes" },
      {
        $group: {
          _id: "$tagTypes",
          count: { $sum: 1 },
        },
      },
    ], { allowDiskUse: true });

    filters.mediaTags = mediaTagCounts.map(({ _id, count }) => ({
      value: _id,
      label: _id.toUpperCase(),
      count,
    }));

    return NextResponse.json(filters);
  } catch (error) {
    console.error("Error fetching filters:", error);
    return NextResponse.json({ error: "Failed to fetch filter options" }, { status: 500 });
  }
}
