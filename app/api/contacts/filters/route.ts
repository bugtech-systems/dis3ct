import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Contact from "@/models/Contact";
import { barangays, municipalities } from "@/lib/locationData";
import mongoose from "mongoose";

export async function GET(req) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const parNum = searchParams.get("parNum");
    const userId = searchParams.get("userId");

    const matchQuery = parNum ? { parNum: new mongoose.Types.ObjectId(parNum) } : {};
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

    // Group precincts under their corresponding barangays
    const precinctResults = await Contact.aggregate([
      { $match: { ...matchQuery, brgyCode: { $ne: null }, precinct: { $ne: null } } },
      {
        $group: {
          _id: { brgyCode: "$brgyCode", precinct: "$precinct" },
          count: { $sum: 1 },
        },
      },
    ]);

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

    // Count occurrences of each tag type, ensuring only the latest tag is considered
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
          "latestTag.value": { $in: ["confirm", "undecided", "declined"] },
          "latestTag.user": userObjectId,
        },
      },
      {
        $group: {
          _id: { $toLower: "$latestTag.value" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).allowDiskUse(true);

    // Count records without a tag of type "tag"
    const unknownCount = await Contact.countDocuments({
      ...matchQuery,
      tags: { $not: { $elemMatch: { tagType: "tag", user: userObjectId } } },
    });

    filters.tags = tagResults.map(({ _id, count }) => ({
      value: _id,
      label: _id.toUpperCase(),
      count,
    }));

    if (unknownCount > 0) {
      filters.tags.push({ value: "unknown", label: "UNKNOWN", count: unknownCount });
    }
    console.log('filter', userObjectId, userId)
    return NextResponse.json(filters);
  } catch (error) {
    console.error("Error fetching filters:", error);
    return NextResponse.json({ error: "Failed to fetch filter options" }, { status: 500 });
  }
}
