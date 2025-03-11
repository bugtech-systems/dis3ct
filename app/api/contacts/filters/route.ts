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

    const matchQuery = parNum ? { parNum: new mongoose.Types.ObjectId(parNum) } : {};

    const filterFields = [
      { desc: "citymunDesc", field: "citymunCode", label: "City/Municipality", data: municipalities },
      { desc: "brgyDesc", field: "brgyCode", label: "Barangay", data: barangays },
      { field: "school", label: "School", data: null },
    ];

    const filters = {};

    console.log(parNum, "PRNUM");

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
      {
        $project: {
          latestTag: {
            $arrayElemAt: [
              { $sortArray: { input: "$tags", sortBy: { timestamp: -1 } } }, 0
            ]
          }
        }
      },
      {
        $group: {
          _id: { $ifNull: ["$latestTag.tagType", "unknown"] },
          count: { $sum: 1 }
        }
      }
    ]);

    filters.tags = tagResults
      .map(({ _id, count }) => ({
        value: _id,
        label: String(_id).toUpperCase(),
        count,
      }))
      .sort((a, b) => a.value.localeCompare(b.value, undefined, { sensitivity: "base" }));

    return NextResponse.json(filters);
  } catch (error) {
    console.error("Error fetching filters:", error);
    return NextResponse.json({ error: "Failed to fetch filter options" }, { status: 500 });
  }
}
