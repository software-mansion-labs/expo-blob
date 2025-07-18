import { Page, Section } from '../components/Page';
import { ArrayBufferBlobTest } from './Blob/ArrayBufferBlobTest';
import { CreateBlobTestComponent } from './Blob/CreateBlobTest';
import { SliceBlobTestComponent } from './Blob/SliceBlobTest';
import { StreamBlobTestComponent } from './Blob/StreamBlobTest';
import { TestContainer } from './Blob/TestContainer';

export default function BlobScreen() {
  return (
    <Page>
      <Section title="Create Blob">
        <TestContainer title="Create Blob Test">
          <CreateBlobTestComponent />
        </TestContainer>
      </Section>
      <Section title="Slice Blob">
        <TestContainer title="Slice Blob Test">
          <SliceBlobTestComponent />
        </TestContainer>
      </Section>
      <Section title="Stream Blob">
        <TestContainer title="Stream Blob Test">
          <StreamBlobTestComponent />
        </TestContainer>
      </Section>
      <Section title="ArrayBuffer/Bytes Blob">
        <TestContainer title="ArrayBuffer/Bytes Blob Test" disabled>
          <ArrayBufferBlobTest />
        </TestContainer>
      </Section>
    </Page>
  );
}
