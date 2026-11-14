import { ArrowLeft } from 'lucide-react';

const NotFound = () => (
  <section className="card text-center py-12 max-w-xl mx-auto" aria-labelledby="not-found-heading">
    <p className="text-6xl font-extrabold tracking-tight text-brand" aria-hidden="true">
      404
    </p>
    <h2 id="not-found-heading" className="mt-3 text-xl font-semibold">
      Page not found
    </h2>
    <p className="mt-2 mb-6 text-fg-muted">
      There is nothing at this address. The post generator is on the home page.
    </p>
    <a href={import.meta.env.BASE_URL} className="btn-primary">
      <ArrowLeft className="size-4" aria-hidden="true" />
      Back to the generator
    </a>
  </section>
);

export default NotFound;
