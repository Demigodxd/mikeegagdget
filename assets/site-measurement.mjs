import {inject} from '@vercel/analytics';
import {injectSpeedInsights} from '@vercel/speed-insights';
// Never send references, email-link fragments, searches or customer-area page views.
import {anonymousEvent} from './measurement-privacy.mjs';

if(!/^\/(admin|account|service|transfer|pickup)(\/|$)/.test(location.pathname)){
 inject({mode:'production',beforeSend:anonymousEvent},process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG);
 injectSpeedInsights({sampleRate:0.2,beforeSend:anonymousEvent});
}
