async function run() {
  console.log("Testing Pagination...");
  let res = await fetch("http://localhost:3000/api/businesses?page=1&limit=5");
  let data = await res.json();
  if (data.data && data.data.length === 5 && data.pagination.total > 5) {
      console.log("✓ Pagination OK");
  } else {
      console.log("✗ Pagination Failed", data);
  }

  console.log("\nTesting Filters (Search)...");
  res = await fetch("http://localhost:3000/api/businesses?search=clove");
  data = await res.json();
  if (data.data && data.data.length > 0) {
      console.log("✓ Search Filter OK", `(Found ${data.data.length})`);
  } else {
      console.log("✗ Search Filter Failed", data);
  }

  console.log("\nTesting CSV Export...");
  res = await fetch("http://localhost:3000/api/export?format=csv");
  const text = await res.text();
  if (text.includes("Business Name,Category,City,State,Country,Rating")) {
      console.log("✓ CSV Headers OK");
      if (text.split("\n").length > 2) {
          console.log("✓ CSV Data Rows OK");
      } else {
          console.log("✗ CSV Export Data Failed");
      }
  } else {
      console.log("✗ CSV Export Headers Failed");
  }
}
run();
