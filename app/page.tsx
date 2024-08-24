'use client';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import PDFView from './PDFView';

const page = () => {
	return (
		<div className="grid">
			<PDFViewer>
				<PDFView />
			</PDFViewer>
			<PDFDownloadLink
				document={<PDFView />}
				fileName="my-file.pdf"
			>
				Download
			</PDFDownloadLink>
		</div>
	);
};

export default page;
