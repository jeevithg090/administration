export default function NotFound() {
  return (
    <section className="card not-found" aria-labelledby="not-found-heading">
      <p className="code" aria-hidden="true">
        404
      </p>
      <h2 id="not-found-heading">Page not found</h2>
      <p>There is nothing at this address. The converter lives on the home page.</p>
      <a className="btn btn-primary" href={import.meta.env.BASE_URL}>
        Go to the converter
      </a>
    </section>
  );
}
