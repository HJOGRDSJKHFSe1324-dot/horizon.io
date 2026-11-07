const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.user.deleteMany({ where: { role: { not: "ADMIN" } } })
  .then(r => console.log("Deleted users:", r.count))
  .finally(() => p.$disconnect());
