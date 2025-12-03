import bcrypt from "bcryptjs";

const password = "admin123";

const run = async () => {
  const hash = await bcrypt.hash(password, 10);
  console.log("HASH FOR admin123:");
  console.log(hash);
};

run().catch(err => {
  console.error(err);
});
