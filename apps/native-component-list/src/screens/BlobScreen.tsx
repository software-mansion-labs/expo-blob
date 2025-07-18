import MonoText from '../components/MonoText';
import { Page, Section } from '../components/Page';
import { CreateBlobTestComponent } from './Blob/CreateBlobTest';
import { TestContainer } from './Blob/TestContainer';

export default function BlobScreen() {
  return (
    <Page>
      <Section title="Create Blob">
        <MonoText>Test Create Blob</MonoText>
        <TestContainer title="Create Blob Test">
          <CreateBlobTestComponent />
        </TestContainer>
      </Section>
    </Page>
  );
}
