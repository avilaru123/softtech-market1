import 'dotenv/config';
import { Prisma } from '@prisma/client';
import { PRODUCTS_DATA } from '../src/data/products';
import { prisma } from '../server/src/db';
import { hashPassword } from '../server/src/passwords';

async function main() {
  for (const product of PRODUCTS_DATA) {
    const data = {
      name: product.name,
      category: product.category,
      categoryLabel: product.categoryLabel,
      shortCategory: product.shortCategory,
      icon: product.icon,
      price: new Prisma.Decimal(product.price),
      priceType: product.priceType,
      image: product.image,
      imageAlt: product.imageAlt,
      badge: product.badge,
      subBadge: product.subBadge,
      description: product.description,
      inStock: product.inStock,
      stockCount: product.stockCount ?? (product.inStock ? 10 : 0),
      isDownload: product.isDownload ?? false,
      wcagLevel: product.wcagLevel,
      inputMethod: product.inputMethod,
      featured: product.featured ?? false,
      contrastRatio: product.contrastRatio ?? null,
      warrantyInfo: product.warrantyInfo ?? null,
    };

    await prisma.product.upsert({
      where: { id: product.id },
      create: { id: product.id, ...data, specs: { create: product.specs } },
      update: {
        ...data,
        specs: {
          deleteMany: {},
          create: product.specs,
        },
      },
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword && adminPassword.length >= 12) {
    const passwordHash = await hashPassword(adminPassword);
    await prisma.user.upsert({
      where: { email: adminEmail },
      create: {
        name: 'Administrador SoftTech',
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
      },
      update: {
        name: 'Administrador SoftTech',
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log('Cuenta administradora configurada.');
  } else {
    console.log('No se creó administrador: configura ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 12 caracteres).');
  }

  console.log(`Se cargaron ${PRODUCTS_DATA.length} productos.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());