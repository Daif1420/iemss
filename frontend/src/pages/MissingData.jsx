import LegacyPage from '../components/LegacyPage';
import bodyHtml from '../legacy-html/missing-data.body.html?raw';
import pageStyleCss from '../legacy-page-styles/missing-data.styles.css?raw';

// Same legacy-page pattern as the other screens, plus the department modal
// styles reused for the "reject reason" dialog.
import deptCss from '../legacy-page-styles/admin-employees.styles.css?raw';

export default function MissingData() {
  return (
    <LegacyPage
      bodyHtml={bodyHtml}
      pageStyleCss={deptCss + '\n' + pageStyleCss}
      scripts={['/legacy/app-missing-data.js', '/legacy/app-shell.js']}
    />
  );
}
