
import fs from "fs";
import path from "path";


// Load JSON Data
const regions = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/regions/refregion.json"), "utf-8"));
const provinces = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/regions/refprovince.json"), "utf-8"));
const municipalities = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/regions/refcitymun.json"), "utf-8"));
const barangays = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/regions/refbrgy.json"), "utf-8"));

export { regions, provinces, municipalities, barangays };
