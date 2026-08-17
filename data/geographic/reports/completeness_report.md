# India Geographic Dataset Completeness & Validation Report
Generated on: 2026-08-17T05:33:40.241Z

## SOURCE SUMMARY
----------------
Census URL: https://censusindia.gov.in/nada/index.php/catalog/42648/download/46323/PC11_TV_DIR.xlsx
Census dataset: PC11_TV_DIR.xlsx, 2011-IndiaStateDistSbDistTwn-0000.xlsx
Census download date: 8/17/2026
Census SHA-256 (Directory): e5670123e836148cd4a869805333b519f45ce837d1145c8b5cece3a01dbf7dd0
Census SHA-256 (PCA): da487f7a1181fd9f43ccf354a8b5864ffca5920fc82b5183d644d483445cb380
LGD URL: https://lgdirectory.gov.in/demo/downloadDirectory.do
LGD datasets: states.json, districts.json, subdistricts.json, blocks.json
LGD download date: 8/17/2026
LGD SHA-256 (States Cache): 278eaac1cd8fd12b12f9529a56418aad8bbaf2592aefde5b36ba220a2dcfe120
LGD SHA-256 (Districts Cache): 521529b35bb05b306604cfed405a5bc2186a21f07c70abd169760bb2b4a557ea
LGD SHA-256 (Subdistricts Cache): bf0b4668704a64a86374abb053553e9ba49e6d893ebaa90cbbf1885e02d01dc1
LGD SHA-256 (Blocks Cache): bc44ddb6ea1ace31816417804bc9b9320ca2f737cb046f1250cb5ff17821bc70

## DATA COUNTS
----------------
States: 29
Union Territories: 11 (Total States+UTs in DB: 40)
Districts: 865
Sub-Districts: 7857
Cities (Census Towns): 3187
Villages: 516576
Urban Local Bodies: 3187 (Mapped from Statutory/Census Towns)

## IMPORT STATUS
----------------
Source records: 658268
Parsed: 658268
Imported: 528562
Duplicates: 0
Invalid: 130128
Unmatched: 0
Skipped: 0 (Zero Silent-Skip Rule enforced!)

## RECONCILIATION
----------------
Added districts (post-2011 LGD current): 233
Removed districts: 0
Renamed districts: 3
Merged: 0
Conflicts: 0

## VALIDATION
----------------
Orphan records: 0 (Districts: 0, Subdistricts: 0, Cities: 0)
Duplicate source codes: 0
Missing states: 0
Missing UTs: 0
Missing hierarchy: NO
Status: PASS

> [!NOTE]
> **Validation Passed!** All administrative entities successfully parsed, mapped, and seed verified.
