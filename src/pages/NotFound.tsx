import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="grid place-items-center py-24 text-center">
      <div className="text-6xl font-black text-untyped">404</div>
      <h1 className="mt-2 text-xl font-bold">That page wandered off</h1>
      <p className="mt-1 text-sm text-muted">Let's get you back to typing.</p>
      <Link to="/" className="btn btn-primary mt-5">Go home</Link>
    </div>
  );
}
