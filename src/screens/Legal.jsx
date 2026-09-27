import { useApp } from '../state/AppContext.jsx';
import { Screen } from '../components/ui.jsx';

export function Legal({ nav, params }) {
  const { t } = useApp();
  const doc = params?.doc === 'terms' ? 'terms' : 'privacy';
  return (
    <Screen title={t(`legal.${doc}.title`)} onBack={nav.goBack}>
      <article className="legal">
        {t(`legal.${doc}.body`)
          .split('\n\n')
          .map((p, i) => (
            <p key={i}>{p}</p>
          ))}
      </article>
    </Screen>
  );
}
