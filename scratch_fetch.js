import fs from 'fs';

async function main() {
  try {
    const res = await fetch("https://worldcup26.ir/get/teams");
    const json = await res.json();
    fs.writeFileSync("C:/Users/vtckt/OneDrive/Documents/projects/fifa/scratch_teams.json", JSON.stringify(json, null, 2));
    console.log("Teams JSON fetched successfully, saved to scratch_teams.json");
  } catch (err) {
    console.error("Error fetching:", err);
  }
}

main();
