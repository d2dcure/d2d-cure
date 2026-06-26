import React, { useState, useEffect } from 'react';
import {
	Table,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
	Button,
	Card,
	CardBody,
	Chip,
	Spinner,
	Popover,
	PopoverTrigger,
	PopoverContent
} from '@nextui-org/react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { CardFooter } from '@nextui-org/react';
import { useUser } from '@/components/UserProvider';
import { useDisclosure } from '@nextui-org/react';
import { AuthChecker } from '@/components/AuthChecker';
import { RiSparklingFill } from 'react-icons/ri';
import StatusChip from '@/components/StatusChip';
import { ErrorChecker } from '@/components/ErrorChecker';
import { EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import Toast from '@/components/Toast';
import ConfirmationModal from '@/components/ConfirmationModal';

/** Helper: List objects by calling GET /api/s3?folder=gel-images */
async function listS3Objects(folder: string) {
	// e.g. /api/s3?folder=gel-images
	const res = await fetch(`/api/s3?folder=${folder}`);
	if (!res.ok) {
		throw new Error(`Failed to list objects in folder=${folder}: ${res.statusText}`);
	}
	const data = await res.json(); // { objects: [ { key, url }, ... ] }
	return data.objects || [];
}

/** Helper: Delete an object by calling DELETE /api/s3?folder=gel-images with { key } in JSON body */
async function deleteS3Object(folder: string, key: string) {
	const res = await fetch(`/api/s3?folder=${folder}`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ key })
	});
	if (!res.ok) {
		throw new Error(`Failed to delete object key=${key}: ${res.statusText}`);
	}
	return res.json(); // { message, deletedKey }
}

interface CharacterizationData {
	curated: boolean;
	submitted_for_curation: boolean;
	approved_by_pi: boolean;
	id: string;
	comments?: string;
	resid?: string;
	resnum?: string;
	resmut?: string;
}

interface GelImage {
	key: string;
	url: string;
	filename: string;
	institution: string;
	userName: string;
	fileDate: string;
	variant: string;
}

const Dashboard = () => {
	const { user } = useUser();
	const [activeIndex, setActiveIndex] = useState<number | null>(null);
	const { isOpen, onOpen, onClose } = useDisclosure();
	//const [characterizationData, setCharacterizationData] = useState<CharacterizationData[]>([]);
	const [characterizationData, setCharacterizationData] = useState<any[]>([]);
	const [isError, setIsError] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [gelImages, setGelImages] = useState<GelImage[]>([]);
	const [selectedImageData, setSelectedImageData] = useState<GelImage | null>(null);
	const [toastConfig, setToastConfig] = useState<{
		show: boolean;
		title: string;
		message?: string;
		type?: 'success' | 'error' | 'info' | 'warning';
	}>({
		show: false,
		title: ''
	});
	const [confirmationModal, setConfirmationModal] = useState<{
		show: boolean;
		imageKey: string | null;
	}>({
		show: false,
		imageKey: null
	});

	useEffect(() => {
		if (!user) {
			onOpen();
			return;
		}
		if (user.user_name) {
			fetchCharacterizationData(user.user_name);
			fetchGelImages();
		}
	}, [user]);

	function downloadCSV() {
		// TODO: Create a shared external function for this,
		// so that the code is not duplicated as much from the function in /database.

		const nRecords = characterizationData.length;

		// Define headers for CSV with plain text alternatives for special characters.
		// TODO: Move to other file.
		const headers = [
			'ID #',
			'Variant',
			'Induced?',
			'Expressed?',
			'Yield (mg/mL)',
			'KM (mM)',
			'KM SD',
			'reference KM',
			'kcat (1/min)',
			'kcat SD',
			'reference kcat',
			'kcat/KM (1/(mM min))',
			'kcat/KM SD',
			'reference kcat/KM',
			'T50 (degrees C)',	// Changed from °C
			'T50 SD',
			'reference T50',
			'Tm (degrees C)',	// Changed from °C
			'Tm SD',
			'Rosetta score change',
			'Institution',
			'Created by',
			'Curated?',
		];

		// Transform data into CSV rows
		const csvRows = characterizationData.map(data => {
			const variant = data.resid === 'X' ? 'WT' : `${data.resid}${data.resnum}${data.resmut}`;
			return [
				data.id,
				variant,
				'data not transfered from old site',	// TODO: Fix when databases are re-synced
				data.expressed ? 'yes' : 'no',
				(data.yield_avg !== null && !isNaN(data.yield_avg)) ? data.yield_avg : (data.expressed ? 'not reported' : ''),
				data.KM_avg || '',
				data.KM_SD || '',
				data.KM_ref || '',
				data.kcat_avg || '',
				data.kcat_SD || '',
				data.kcat_ref || '',
				data.kcat_over_KM || '',
				data.kcat_over_KM_SD || '',
				data.kcat_over_KM_ref || '',
				data.T50 || '',
				data.T50_SD || '',
				data.T50_ref || '',
				data.Tm || '',
				data.Tm_SD || '',
				data.Rosetta_score || '',
				data.institution || '',
				data.creator || 'unknown',
				data.curated ? 'yes' : 'no'
			].join(',');
		});

		// Combine headers and rows
		const csvContent = [headers.join(','), ...csvRows].join('\n');

		// Create and trigger download
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute('download',
				'BglB_characterization_data_from_' + user.user_name + '.csv');
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	async function fetchCharacterizationData(userName: string) {
		try {
			setIsLoading(true);
			const response = await fetch(`/api/getCharacterizationDataForUser?userName=${userName}`);
			if (!response.ok) {
				throw new Error(
					`GET /api/getCharacterizationDataForUser ${response.status} - Failed to fetch characterization data`
				);
			}
			const data = await response.json();
			if (!Array.isArray(data)) {
				throw new Error('GET /api/getCharacterizationDataForUser - Invalid data format: Expected array');
			}
			setCharacterizationData(data);
		} catch (error: any) {
			console.error('Error fetching characterization data:', error);
			setIsError(true);
			setErrorMessage(error?.message || 'Failed to fetch characterization data');
		} finally {
			setIsLoading(false);
		}
	}

	async function fetchGelImages() {
		try {
			setIsLoading(true);
			// 1) get list of objects from /api/s3?folder=gel-images
			const objects = await listS3Objects('gel-images');
			// objects: [ { key, url }, { key, url }, ...]

			const processedImages: GelImage[] = [];

			// We replicate your existing logic: parse the filename (institution-variant-username-date)
			// ignoring subfolders, etc. Also filter only userName === current user?
			for (const obj of objects) {
				if (!obj.key) continue;

				// "key" might be "gel-images/institution-variant-userName-date.ext"
				const filenameFull = obj.key.split('/').pop() || ''; // "institution-variant-userName-date.ext"
				const [institution, variant, userName, dateAndExt] = filenameFull.split('-');
				if (!institution || !variant || !userName || !dateAndExt) {
					// If the naming doesn't match exactly 4 parts, skip
					continue;
				}
				// e.g. dateAndExt => "2023.???" 
				// We'll do a naive approach
				const splitted = dateAndExt.split('.');
				const dateStr = splitted[0];
				const extension = splitted[1] || '';

				// Only return images for current user
				if (userName === user?.user_name) {
					processedImages.push({
						key: obj.key,
						url: obj.url, // from the listing
						filename: filenameFull, // or `filenameFull` + extension
						institution,
						userName,
						fileDate: dateStr,
						variant
					});
				}
			}

			// Sort by date descending
			const sortedImages = [...processedImages].sort((a, b) => {
				// parse a.fileDate => might not be an actual date, do a string compare or parse
				// If it's something like "2023-03-01", we can parse. If "030123", also parse or fallback
				// We'll do a fallback to string compare
				const dateA = Date.parse(a.fileDate) || 0;
				const dateB = Date.parse(b.fileDate) || 0;
				return dateB - dateA; // newest first
			});

			setGelImages(sortedImages);
		} catch (err: any) {
			console.error('Error fetching gel images:', err);
			showToast('Error', 'Failed to fetch gel images', 'error');
		} finally {
			setIsLoading(false);
		}
	}

	function toggleAccordion(index: number) {
		setActiveIndex(activeIndex === index ? null : index);
	}

	function showToast(title: string, message?: string, type: 'success' | 'error' | 'info' | 'warning' = 'error') {
		setToastConfig({
			show: true,
			title,
			message,
			type
		});
	}

	async function handleDeleteImage(imageKey: string) {
		// show confirmation
		setConfirmationModal({
			show: true,
			imageKey
		});
	}

	async function handleConfirmDelete() {
		const imageKey = confirmationModal.imageKey;
		if (!imageKey) return;

		try {
			// 1) call DELETE /api/s3?folder=gel-images with { key: imageKey }
			await deleteS3Object('gel-images', imageKey);

			// 2) remove from state
			setGelImages((prev) => prev.filter((img) => img.key !== imageKey));

			if (selectedImageData?.key === imageKey) {
				setSelectedImageData(null);
			}

			showToast('Image deleted successfully', undefined, 'success');
		} catch (err: any) {
			console.error('Error deleting image:', err);
			showToast('Failed to delete image', 'Please try again later');
		} finally {
			setConfirmationModal({ show: false, imageKey: null });
		}
	}

	function handlePrevImage() {
		if (!selectedImageData) return;
		const currentIndex = gelImages.findIndex((img) => img.key === selectedImageData.key);
		const prevIndex = currentIndex > 0 ? currentIndex - 1 : gelImages.length - 1;
		setSelectedImageData(gelImages[prevIndex]);
	}

	function handleNextImage() {
		if (!selectedImageData) return;
		const currentIndex = gelImages.findIndex((img) => img.key === selectedImageData.key);
		const nextIndex = currentIndex < gelImages.length - 1 ? currentIndex + 1 : 0;
		setSelectedImageData(gelImages[nextIndex]);
	}

	return (
		<>
			<NavBar />
			<AuthChecker minimumStatus="student">
				<ErrorChecker isError={isError} errorMessage={errorMessage} errorType="api">
					<div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 bg-white">
						{/* Welcome Section */}
						<div className="flex items-center space-x-4 mb-16">
							{user?.user_name && (
								<>
									<div>
										<Chip className="bg-[#E6F1FE] mb-2 text-[#06B7DB]" variant="flat">
											{user?.status}
										</Chip>
										<div className="flex items-center gap-2">
											<h1 className="text-4xl">
												Welcome, <span className="text-[#06B7DB]">{user.user_name}</span>!
											</h1>
										</div>
									</div>
								</>
							)}
						</div>

						{/* Action Cards Section */}
						<div
							className={`grid gap-6 mb-20 ${
								user?.status === 'ADMIN' || user?.status === 'PROFESSOR'
									? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
									: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
							}`}
						>
							{[
								{
									title: 'Single Variant',
									link: '/submit/?single_variant=1',
									linkText: 'Submit Data'
								},
								{
									title: 'Wild Type',
									link: '/submit/?wild_type=1',
									linkText: 'Submit Data'
								},
								{
									title: 'Gel Image',
									link: '/submit/gel_image_upload',
									linkText: 'Upload Image'
								},
								...(user?.status === 'ADMIN' || user?.status === 'PROFESSOR'
									? [
											{
												title: 'Curate',
												link: '/curate',
												linkText: 'Curate Data'
											}
										]
									: [])
							].map((item, index) => (
								<Link href={item.link} key={index}>
									<Card
										isPressable
										className="h-[150px] w-full transition-transform duration-200 hover:scale-105"
									>
										<CardBody className="text-3xl pt-2 font-light">
											<h3 className="pl-4 pt-2 pb-5 text-3xl whitespace-nowrap overflow-hidden text-ellipsis">
												{item.title}
											</h3>
										</CardBody>
										<CardFooter>
											<span className="text-sm px-4 pb-3 text-[#06B7DB]">
												{item.linkText} {'>'}
											</span>
										</CardFooter>
									</Card>
								</Link>
							))}
						</div>

						{/* Submissions Section */}
						<div className="mb-12">
							<h2 className="text-4xl mb-8">My Submissions</h2>

							{/* Variant Profiles Table */}
							<div className="mb-12">
								<div className="flex justify-between items-center mb-4">
									<h3 className="text-xl text-gray-500">Variant Profiles</h3>
									<div className="flex gap-2">
										<Button
											variant="bordered"
											className="border-[#06B7DB] text-[#06B7DB]"
											onClick={downloadCSV}
										>
											Download as <code>.csv</code> File
										</Button>
										<Link href="/submit" passHref>
											<Button color="primary" className="bg-[#06B7DB]">
												Submit New Data
											</Button>
										</Link>
									</div>
								</div>
								<Table aria-label="Variant Profiles" classNames={{ table: 'min-h-[100px]' }}>
									<TableHeader>
										<TableColumn>Status</TableColumn>
										<TableColumn>Enzyme</TableColumn>
										<TableColumn>Variant</TableColumn>
										<TableColumn>ID</TableColumn>
										<TableColumn>Comments</TableColumn>
										<TableColumn>Actions</TableColumn>
									</TableHeader>
									<TableBody>
										{characterizationData.map((data, index) => {
											const variant = data.resid === 'X' ? 'WT' : `${data.resid}${data.resnum}${data.resmut}`;
											const viewUrl =
												variant === 'WT' ? `/submit/wild_type/${data.id}` : `/submit/single_variant/${data.id}`;

											return (
												<TableRow key={index}>
													<TableCell>
														<StatusChip
															status={
																data.curated
																	? 'approved'
																	: data.approved_by_pi
																	? 'pi_approved'
																	: data.submitted_for_curation
																	? 'pending_approval'
																	: 'in_progress'
															}
														/>
													</TableCell>
													<TableCell>BglB</TableCell>
													<TableCell>{variant}</TableCell>
													<TableCell>{data.id}</TableCell>
													<TableCell className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] md:max-w-[300px]">
														{data.comments || 'No comments'}
													</TableCell>
													<TableCell>
														<Link href={viewUrl} className="text-[#06B7DB]">
															View
														</Link>
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</div>

							{/* Gel Image Uploads Table */}
							<div>
								<div className="flex justify-between items-center mb-4">
									<h3 className="text-xl text-gray-500">Gel Image Uploads</h3>
									<div className="flex gap-2">
										<Link href="/submit/gel_image_upload" passHref>
											<Button color="primary" className="bg-[#06B7DB]">
												Upload New Image
											</Button>
										</Link>
									</div>
								</div>
								{isLoading ? (
									<Table
										aria-label="Gel Image Uploads Loading"
										classNames={{
											base: 'max-h-[400px]',
											wrapper: 'max-h-[400px]'
										}}
									>
										<TableHeader>
											<TableColumn>PREVIEW</TableColumn>
											<TableColumn>FILENAME</TableColumn>
											<TableColumn>INSTITUTION</TableColumn>
											<TableColumn>Actions</TableColumn>
										</TableHeader>
										<TableBody>
											<TableRow>
												<TableCell>
													<Spinner size="sm" />
												</TableCell>
												<TableCell>
													<Spinner size="sm" />
												</TableCell>
												<TableCell>
													<Spinner size="sm" />
												</TableCell>
												<TableCell>
													<Spinner size="sm" />
												</TableCell>
											</TableRow>
										</TableBody>
									</Table>
								) : gelImages.length === 0 ? (
									<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
										<div className="flex items-center">
											<div className="flex-shrink-0">
												<svg
													className="h-5 w-5 text-gray-600"
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
												>
													<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
													<polyline points="14 2 14 8 20 8" />
													<line x1="12" y1="18" x2="12" y2="12" />
													<line x1="9" y1="15" x2="15" y2="15" />
												</svg>
											</div>
											<div className="ml-3">
												<p className="text-sm text-gray-600">
													You haven&apos;t uploaded any gel images yet.{' '}
													<Link
														href="/submit/gel_image_upload"
														className="font-medium text-[#06B7DB] hover:text-[#06B7DB]/80"
													>
														Upload your first image
													</Link>
												</p>
											</div>
										</div>
									</div>
								) : (
									<Table
										aria-label="Gel Image Uploads"
										classNames={{
											base: 'max-h-[400px]',
											wrapper: 'max-h-[400px]'
										}}
									>
										<TableHeader>
											<TableColumn>PREVIEW</TableColumn>
											<TableColumn>FILENAME</TableColumn>
											<TableColumn>INSTITUTION</TableColumn>
											<TableColumn>Actions</TableColumn>
										</TableHeader>
										<TableBody>
											{gelImages.map((image, index) => (
												<TableRow key={image.key}>
													<TableCell>
														<img
															src={image.url}
															alt={`Gel Image ${index + 1}`}
															className="w-12 h-12 object-cover rounded-lg"
														/>
													</TableCell>
													<TableCell className="max-w-[200px] truncate">{image.filename}</TableCell>
													<TableCell>{image.institution}</TableCell>
													<TableCell>
														<div className="flex gap-2">
															<Button isIconOnly variant="light" onClick={() => setSelectedImageData(image)}>
																<EyeIcon className="h-5 w-5" />
															</Button>
															<Button
																isIconOnly
																variant="light"
																color="danger"
																onClick={() => handleDeleteImage(image.key)}
															>
																<TrashIcon className="h-5 w-5" />
															</Button>
														</div>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								)}
							</div>
						</div>
					</div>
				</ErrorChecker>
			</AuthChecker>
			<Footer />

			{/* Floating star icon with insights */}
			<Popover placement="top-end">
				<PopoverTrigger>
					<div className="fixed bottom-6 right-6 z-50 cursor-pointer">
						<div className="bg-white/30 backdrop-blur-md rounded-full p-2 shadow-lg border border-white/50 hover:bg-white/40 transition-all duration-200">
							<RiSparklingFill className="text-gray-600 text-xl" />
						</div>
					</div>
				</PopoverTrigger>
				<PopoverContent className="max-w-[300px]">
					<div className="px-4 py-3">
						<div className="flex items-center gap-2 mb-3">
							<RiSparklingFill className="text-gray-600" />
							<h4 className="text-sm font-medium text-gray-700">Quick Insights</h4>
						</div>
						<div className="text-sm text-gray-600">
							You have successfully contributed {characterizationData.length} variants to the research database.
							{characterizationData.filter((d) => d.curated).length > 0 && (
								<div className="mt-2">
									✓ {characterizationData.filter((d) => d.curated).length} submissions have completed the curation
									process
								</div>
							)}

							{characterizationData.filter((d) => !d.curated && d.submitted_for_curation).length > 0 && (
								<div className="mt-2">
									🔍{' '}
									{characterizationData.filter((d) => !d.curated && d.submitted_for_curation).length} submissions are
									pending review
								</div>
							)}

							{characterizationData.filter((d) => !d.submitted_for_curation).length > 0 && (
								<div className="mt-2">
									💡{' '}
									{characterizationData.filter((d) => !d.submitted_for_curation).length} variants are prepared for
									submission
								</div>
							)}
						</div>
					</div>
				</PopoverContent>
			</Popover>

			<Toast
				show={toastConfig.show}
				onClose={() => setToastConfig((prev) => ({ ...prev, show: false }))}
				title={toastConfig.title}
				message={toastConfig.message}
				type={toastConfig.type}
			/>

			<ConfirmationModal
				isOpen={confirmationModal.show}
				onClose={() => setConfirmationModal({ show: false, imageKey: null })}
				onConfirm={handleConfirmDelete}
				title="Delete Image"
				message="Are you sure you want to delete this image?"
				confirmText="Delete"
				cancelText="Cancel"
			/>

			{selectedImageData && (
				<div
					className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
					onClick={() => setSelectedImageData(null)}
				>
					<div
						className="bg-white rounded-xl flex flex-col lg:flex-row w-full max-w-[95vw] lg:max-w-6xl 
							max-h-[95vh] overflow-hidden relative"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Navigation Buttons - Hide on mobile */}
						<button
							className="hidden lg:block absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm 
								rounded-full p-2.5 shadow-lg hover:bg-white transition-colors z-10 group"
							onClick={(e) => {
								e.stopPropagation();
								handlePrevImage();
							}}
						>
							<svg
								className="w-5 h-5 group-hover:scale-110 transition-transform"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							</svg>
						</button>

						<button
							className="hidden lg:block absolute right-[400px] top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm 
								rounded-full p-2.5 shadow-lg hover:bg-white transition-colors z-10 group"
							onClick={(e) => {
								e.stopPropagation();
								handleNextImage();
							}}
						>
							<svg
								className="w-5 h-5 group-hover:scale-110 transition-transform"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
							</svg>
						</button>

						{/* Left side - Image */}
						<div className="flex-1 bg-gray-100 flex flex-col items-center justify-center p-4 relative min-h-[300px]">
							<img
								src={selectedImageData.url}
								alt="Gel Image Preview"
								className="max-w-full max-h-[40vh] lg:max-h-[80vh] object-contain rounded-lg shadow-md"
							/>

							{/* Mobile navigation buttons */}
							<div className="flex lg:hidden items-center justify-between w-full absolute top-1/2 -translate-y-1/2 px-2">
								<button
									className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors"
									onClick={(e) => {
										e.stopPropagation();
										handlePrevImage();
									}}
								>
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
									</svg>
								</button>
								<button
									className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors"
									onClick={(e) => {
										e.stopPropagation();
										handleNextImage();
									}}
								>
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
									</svg>
								</button>
							</div>

							{/* Image counter overlay */}
							<div
								className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md text-white 
								px-4 py-1.5 rounded-full text-sm font-medium tracking-wide"
							>
								Image {gelImages.findIndex((img) => img.key === selectedImageData.key) + 1} of {gelImages.length}
							</div>
						</div>

						{/* Right side - Info Card */}
						<div
							className="w-full lg:w-[400px] p-4 sm:p-6 lg:p-8 border-t lg:border-t-0 lg:border-l border-gray-200 
							overflow-y-auto max-h-[60vh] lg:max-h-[80vh]"
						>
							<div className="flex justify-between items-start mb-6">
								<div>
									<h3 className="text-xl lg:text-2xl font-semibold text-gray-800">Image Details</h3>
									<p className="text-sm text-gray-500 mt-1">View and manage image information</p>
								</div>
								<button
									className="text-gray-400 hover:text-gray-600 transition-colors"
									onClick={() => setSelectedImageData(null)}
								>
									<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>

							<div className="space-y-4">
								<div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
									<label className="text-sm font-medium text-gray-600">Filename</label>
									<p className="font-medium break-words mt-1 text-gray-800">{selectedImageData.filename}</p>
								</div>

								<div className="grid grid-cols-2 gap-3 sm:gap-4">
									<div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
										<label className="text-sm font-medium text-gray-600">Institution</label>
										<p className="font-medium mt-1 text-gray-800">{selectedImageData.institution}</p>
									</div>

									<div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
										<label className="text-sm font-medium text-gray-600">Variant</label>
										<p className="font-medium mt-1 text-gray-800">{selectedImageData.variant}</p>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3 sm:gap-4">
									<div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
										<label className="text-sm font-medium text-gray-600">Date</label>
										<p className="font-medium mt-1 text-gray-800">{selectedImageData.fileDate}</p>
									</div>

									<div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
										<label className="text-sm font-medium text-gray-600">Uploaded By</label>
										<p className="font-medium mt-1 text-gray-800">{selectedImageData.userName}</p>
									</div>
								</div>

								<div className="pt-4 space-y-3">
									<a
										href={selectedImageData.url}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center justify-center gap-2 w-full bg-[#06B7DB] text-white py-2.5 px-4 
											rounded-lg hover:bg-[#05a5c6] transition-colors font-medium"
									>
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
											/>
										</svg>
										Download Image
									</a>

									{user?.user_name === selectedImageData.userName && (
										<>
											<button
												onClick={() => handleDeleteImage(selectedImageData.key)}
												className="flex items-center justify-center gap-2 w-full text-red-500 hover:text-white py-2.5 px-4 
													rounded-lg transition-all border border-red-500 hover:border-red-600 hover:bg-red-500 font-medium"
											>
												<TrashIcon className="h-5 w-5" />
												Delete Image
											</button>
											<div className="flex items-center gap-2 text-sm text-gray-500 px-1">
												<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
												As the uploader, you can delete this image
											</div>
										</>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default Dashboard;
