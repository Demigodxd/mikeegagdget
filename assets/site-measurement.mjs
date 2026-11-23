import {inject} from '@vercel/analytics';
import {injectSpeedInsights} from '@vercel/speed-insights';
// Never send references, email-link fragments, searches or customer-area page views.
import {anonymousEvent} from './measurement-privacy.mjs';

import {readConsent,privatePage} from './consent-core.mjs';
let injected=false;
function enableMeasurement(){
if(!injected&&readConsent(localStorage).analytics&&!privatePage(location.pathname)){
 injected=true;
 inject({mode:'production',beforeSend:anonymousEvent},process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG);
 injectSpeedInsights({sampleRate:0.2,beforeSend:anonymousEvent});
}

}
enableMeasurement();window.addEventListener('lisa-consent-change',enableMeasurement);
