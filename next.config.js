/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [

      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      
      },
      

      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'abs.twimg.com',
        pathname: '/**',
      },
      
      // Instagram (though they have strict API limitations)
      {
        protocol: 'https',
        hostname: 'scontent.cdninstagram.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.cdninstagram.com',
        pathname: '/**',
      },
      
      // Giphy (for GIFs)
      {
        protocol: 'https',
        hostname: 'media.giphy.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media0.giphy.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media1.giphy.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media2.giphy.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media3.giphy.com',
        pathname: '/**',
      },
      
      // Imgur (common for Reddit content)
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
        pathname: '/**',
      },
      
      // Common CDNs that blogs often use
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com', // Covers S3, CloudFront, etc.
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
        pathname: '/**',
      },
      
      // WordPress sites (if you embed from WP blogs)
      {
        protocol: 'https',
        hostname: '*.wp.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.files.wordpress.com',
        pathname: '/**',
      },
      
      // Medium (for embedding Medium content)
      {
        protocol: 'https',
        hostname: 'miro.medium.com',
        pathname: '/**',
      },
      
      // Pixabay (another free image source)
      {
        protocol: 'https',
        hostname: 'pixabay.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
        pathname: '/**',
      },
      
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        pathname: '/**',
      },
      
      // Vimeo (already have vimeocdn but adding official domains)
      {
        protocol: 'https',
        hostname: 'vimeo.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.vimeo.com',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;