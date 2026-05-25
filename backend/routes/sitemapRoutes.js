import express from 'express';
import Blog from '../models/Blog.js';

const router = express.Router();

router.get('/sitemap.xml', async (req, res) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Static public promo pages
    const staticPages = [
      '',
      '/about',
      '/services',
      '/careers',
      '/contact',
      '/blog',
    ];

    // Query published blogs for dynamic mapping
    const blogs = await Blog.find({ status: 'Published' }).select('slug updatedAt');

    // Build the XML structure
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Add static pages
    staticPages.forEach((page) => {
      xml += `  <url>\n`;
      xml += `    <loc>${frontendUrl}${page}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>${page === '' ? '1.0' : '0.8'}</priority>\n`;
      xml += `  </url>\n`;
    });

    // Add dynamic blog pages
    blogs.forEach((blog) => {
      xml += `  <url>\n`;
      xml += `    <loc>${frontendUrl}/blog/${blog.slug}</loc>\n`;
      xml += `    <lastmod>${new Date(blog.updatedAt).toISOString().split('T')[0]}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>\n`;

    // Send response with proper XML content-type
    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap Generation Error:', error.message);
    res.status(500).send('Error generating sitemap');
  }
});

export default router;
