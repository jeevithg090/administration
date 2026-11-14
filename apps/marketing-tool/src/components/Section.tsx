import type { ReactNode } from 'react';

interface SectionProps {
  id: string;
  step: number;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}

/** A numbered form section card. */
const Section = ({ id, step, title, description, children }: SectionProps) => (
  <section className="card" aria-labelledby={`${id}-heading`}>
    <h2 id={`${id}-heading`} className="section-heading">
      <span className="step-badge" aria-hidden="true">
        {step}
      </span>
      <span>{title}</span>
    </h2>
    {description ? <p className="section-desc">{description}</p> : <div className="mb-5" />}
    {children}
  </section>
);

export default Section;
