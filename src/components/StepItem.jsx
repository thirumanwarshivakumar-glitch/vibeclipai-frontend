export default function StepItem({ number, icon, title, description }) {
    return (
        <div className="step-item">
            <div className="step-icon">{icon}</div>
            <p className="step-number">Step {number}</p>
            <h3 className="step-title">{title}</h3>
            <p className="step-desc">{description}</p>
        </div>
    );
}
