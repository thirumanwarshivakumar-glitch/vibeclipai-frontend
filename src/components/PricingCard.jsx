import { Link } from 'react-router-dom';

export default function PricingCard({ plan }) {
    return (
        <div className={`pricing-card${plan.popular ? ' popular' : ''}`} id={`pricing-${plan.id}`}>
            {plan.popular && <span className="popular-badge">Most Popular</span>}
            <h3 className="pricing-name">{plan.name}</h3>
            <div className="pricing-price">
                <span className="currency">$</span>{plan.price.toFixed(2)}
            </div>
            <p className="pricing-videos">{plan.videos} video{plan.videos > 1 ? 's' : ''}</p>
            <ul className="pricing-features">
                {plan.features.map((feature, i) => (
                    <li key={i}>{feature}</li>
                ))}
            </ul>
            <Link
                to={`/checkout?plan=${plan.id}`}
                className={`btn ${plan.popular ? 'btn-primary' : 'btn-outline'}`}
                style={{ width: '100%' }}
            >
                Buy Now
            </Link>
        </div>
    );
}
