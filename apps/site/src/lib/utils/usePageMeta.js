import { useEffect } from 'react';

/**
 * Set the document title and meta description per route.
 *
 * A small, dependency-free stand-in for a head manager. If the site later
 * moves to server rendering for SEO, this is the only place that changes.
 */
export function usePageMeta({ title, description }) {
  useEffect(() => {
    if (title) document.title = title;

    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', 'description');
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', description);
    }
  }, [title, description]);
}

export default usePageMeta;
