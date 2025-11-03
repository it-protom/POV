const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^a-z0-9-]/g, '')      // Remove all non-alphanumeric except -
    .replace(/--+/g, '-')            // Replace multiple - with single -
    .replace(/^-+/, '')              // Trim - from start
    .replace(/-+$/, '');             // Trim - from end
}

async function main() {
  // Aggiorna slug per tutti i form
  const forms = await prisma.form.findMany();
  for (const form of forms) {
    if (!form.slug) {
      let baseSlug = slugify(form.title);
      let slug = baseSlug;
      let i = 1;
      // Assicura unicità
      while (await prisma.form.findFirst({ where: { slug } })) {
        slug = `${baseSlug}-${i++}`;
      }
      await prisma.form.update({ where: { id: form.id }, data: { slug } });
      console.log(`Aggiornato form ${form.title} con slug: ${slug}`);
    }
  }

  // Aggiorna progressiveNumber per tutte le risposte di ogni form
  const allForms = await prisma.form.findMany({ include: { responses: true } });
  for (const form of allForms) {
    // Ordina per data
    const sortedResponses = form.responses.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    for (let i = 0; i < sortedResponses.length; i++) {
      const response = sortedResponses[i];
      if (response.progressiveNumber == null) {
        await prisma.response.update({
          where: { id: response.id },
          data: { progressiveNumber: i + 1 },
        });
        console.log(`Aggiornata risposta ${response.id} con progressiveNumber: ${i + 1}`);
      }
    }
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
}); 