import React, { useEffect } from "react";

type SeoProps = {
  title: string;
  description?: string;
  canonicalPath?: string;
};

export default function Seo({ title, description, canonicalPath }: SeoProps) {
  useEffect(() => {
    // Title
    document.title = title;

    // Meta description
    if (description) {
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);
    }

    // Canonical link
    if (canonicalPath) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      const origin = window.location.origin;
      link.setAttribute('href', `${origin}${canonicalPath}`);
    }
  }, [title, description, canonicalPath]);

  return null;
}
