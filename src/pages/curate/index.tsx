import React, { useState, useEffect, useCallback } from 'react';
import "../../app/globals.css";
import { useUser } from '@/components/UserProvider';
import { AuthChecker } from '@/components/AuthChecker';
import NavBar from '@/components/NavBar';
import { Breadcrumbs, BreadcrumbItem, Button, Checkbox, Chip, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Select, SelectItem, Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/react";
import { FaFilter, FaInfoCircle, FaArrowUp, FaArrowDown, FaColumns } from 'react-icons/fa';
import { Key, Selection, SortDescriptor } from '@react-types/shared';
import Link from 'next/link';

const columns = [
    { name: "Approved", uid: "approved_by_pi", sortable: false},
    { name: "Status", uid: "status", sortable: false},
    { name: "ID", uid: "id", sortable: true },
    { name: "Variant", uid: "variant", sortable: true },
    { name: "Creator", uid: "creator", sortable: true },
    { name: "Assay Date", uid: "assay_date", sortable: false},
    { name: "Km", uid: "km", sortable: false },
    { name: "Kcat", uid: "kcat", sortable: false },
    { name: "T50", uid: "t50", sortable: false },
    { name: "Comments", uid: "comments", sortable: false },
    { name: "Actions", uid: "actions", sortable: false }
];

const CuratePage = () => {
    const { user, loading } = useUser();

    const [data, setData] = useState<any[]>([]);
    const [viewableData, setViewableData] = useState<any[]>([]);
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "id",
        direction: "ascending"
    });
    const [checkedItems, setCheckedItems] = useState<Selection>(new Set([]));
    const [viewAs, setViewAs] = useState<string>("")
    const [isLoading, setIsLoading] = useState(true);

    interface Institution {
        abbr: string;
        fullname: string;
    }
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [showNonSubmitted, setShowNonSubmitted] = useState(false);
    const [selectedInstitution, setSelectedInstitution] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [visibleColumns, setVisibleColumns] = useState(new Set([
        "approved_by_pi", "status", "id", "variant", "creator", "assay_date", "km", "kcat", "t50", "comments", "actions"
    ]));

    const headerColumns = React.useMemo(() => {
        return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));
    }, [visibleColumns]);

    useEffect(() => {
        const fetchInstitutions = async () => {
            const response = await fetch('/api/getInstitutions');
            const data = await response.json();

            const sortedData = data.sort((a:any, b:any) => a.fullname.localeCompare(b.fullname));
            setInstitutions(sortedData);
        };

        const fetchData = async () => {
            if (!user) return;

            setViewAs(user.status);
            const response = await fetch('/api/getPendingData');
            const data = await response.json();
            setData(data)
            filterAndSortData(data);
        };
        fetchInstitutions();
        fetchData();
        setIsLoading(false);
    }, [user])

    useEffect(() => {
        if (!user) return;

        setIsLoading(true);
        setCheckedItems(new Set([]))    // Reset to avoid confusion when switching
        filterAndSortData(data);
        setIsLoading(false);
    }, [viewAs])

    useEffect(() => {
        if (!user) return;

        setIsLoading(true);
        filterAndSortData(data);
        setIsLoading(false);
    }, [showNonSubmitted, selectedInstitution, searchTerm])

    const renderCell = useCallback((data:any, columnKey:Key) => {
        switch (columnKey) {
            case "status":
                {/* TODO: Hard coded rn!! Also approved-by-pi part of status?*/}
                return (
                    <Chip className="bg-[#E6F1FE] text-[#06B7DB]" variant="flat">
                        In Progress
                    </Chip>
                )
                // return (
                //     <div>
                //         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
                //             <path fill-rule="evenodd" clip-rule="evenodd" d="M8 1.90186C4.1 1.90186 1 5.00186 1 8.90186C1 12.8019 4.1 15.9019 8 15.9019C11.9 15.9019 15 12.8019 15 8.90186C15 5.00186 11.9 1.90186 8 1.90186ZM7 11.6022L4.5 9.10225L5.3 8.30225L7 10.0022L10.7 6.30225L11.5 7.10225L7 11.6022ZM2 8.90186C2 12.2019 4.7 14.9019 8 14.9019C11.3 14.9019 14 12.2019 14 8.90186C14 5.60186 11.3 2.90186 8 2.90186C4.7 2.90186 2 5.60186 2 8.90186Z" fill="#17C964"/>
                //         </svg>
                //         <Chip className="bg-[#E6F1FE] text-[#06B7DB]" variant="flat">
                //             In Progress
                //         </Chip>
                //     </div>
                // );
            case "approved_by_pi":
                // TODO: Discuss is this needed?
                if (viewAs === "ADMIN" && data.approved_by_pi) {
                    return (
                        <Chip className="bg-[#D4F4D9]" variant="flat">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="16" viewBox="0 0 12 16" fill="none">
                                <path d="M10.3684 5.05041L4.86839 12.5504C4.83647 12.594 4.79856 12.6286 4.75683 12.6522C4.7151 12.6757 4.67037 12.6879 4.62519 12.6879C4.58002 12.6879 4.53529 12.6757 4.49356 12.6522C4.45182 12.6286 4.41391 12.594 4.38199 12.5504L1.97574 9.26916C1.91124 9.1812 1.875 9.06191 1.875 8.93752C1.875 8.81313 1.91124 8.69383 1.97574 8.60588C2.04024 8.51792 2.12772 8.46851 2.21894 8.46851C2.31016 8.46851 2.39764 8.51792 2.46214 8.60588L4.62519 11.5561L9.88199 4.38713C9.94649 4.29917 10.034 4.24976 10.1252 4.24976C10.2164 4.24976 10.3039 4.29917 10.3684 4.38713C10.4329 4.47508 10.4691 4.59438 10.4691 4.71877C10.4691 4.84316 10.4329 4.96245 10.3684 5.05041Z" fill="#17C964"/>
                            </svg>
                        </Chip>

                    )
                }
                return <></>
            case "id":
                return data.id
            case "variant":
                return getVariantDisplay(data.resid, data.resnum, data.resmut)
            case "creator":
                return data.creator
            case "assay_date":
                return "hi"
            case "km":
                return data.KM_avg !== null && !isNaN(data.KM_avg) ? `${roundTo(data.KM_avg, 2)} ± ${data.KM_SD !== null && !isNaN(data.KM_SD) ? roundTo(data.KM_SD, 2) : '—'}` : '—'
            case "kcat":
                return data.kcat_avg !== null && !isNaN(data.kcat_avg) ? `${roundTo(data.kcat_avg, 1)} ± ${data.kcat_SD !== null && !isNaN(data.kcat_SD) ? roundTo(data.kcat_SD, 1) : '—'}` : '—'
            case "t50":
                return data.T50 !== null && !isNaN(data.T50) ? `${roundTo(data.T50, 1)} ± ${data.T50_SD !== null && !isNaN(data.T50_SD) ? roundTo(data.T50_SD, 1) : '—'}` : '—'
            case "comments":
                return decodeHTML(data.comments)
            case "actions":
                return (
                    <Link href={`/submit/single_variant/${encodeURIComponent(data.id)}`} className="text-[#06B7DB]">
                        View
                    </Link>
                )
        }
    }, []);

    const filterAndSortData = (data:any) => {
        let filteredData = data;
        if (user.status === "professor" || viewAs === "professor") {
            filteredData = data
                .filter((item:any) => item.institution === user.institution)
                .filter((item:any) => item.approved_by_pi === false);
        }
        let sortedData = sortData(filteredData, sortDescriptor)
        if (!showNonSubmitted) {
            sortedData = sortedData
                .filter((item:any) => item.submitted_for_curation === true);
        }
        if (viewAs === "ADMIN" && selectedInstitution !== "") {
            sortedData = sortedData
                .filter((item:any) => item.institution === selectedInstitution)
        }
        if (searchTerm.trim()) {
            sortedData = sortedData
                .filter((item:any) =>
                    getVariantDisplay(item.resid, item.resnum, item.resmut).includes(searchTerm.trim()))
        }

        setViewableData(sortedData);
    }

    const handleColumnClick = (sortDescriptor: SortDescriptor) => {
        setSortDescriptor(sortDescriptor)
        const sortedData = sortData(viewableData, sortDescriptor)
        setViewableData(sortedData);
    };

    function sortData(data: any, sortDescriptor: SortDescriptor) {
        const sortColumn = sortDescriptor.column;
        const sortDirection = sortDescriptor.direction;

        const sortedData = data.sort((a: any, b: any) => {
            // If user is admin, sort to show data approved by pi first
            let valA, valB;
            let compareVal;

            if (viewAs === "ADMIN") {
                valA = a.approved_by_pi;
                valB = b.approved_by_pi;
                if (valA && !valB) {        // A is approved, B is not, A comes first
                    return -1;
                } else if (valB && !valA) { // B is approved, A is not, B comes first
                    return 1;
                } // Otherwise continue with rest of sorting
            }

            if (sortColumn === 'id') {
                valA = a.id;
                valB = b.id;
                compareVal = valA - valB;
            } else if (sortColumn === 'variant') {
                valA = a.resnum;
                valB = b.resnum;
                compareVal = valA - valB;
                if (compareVal === 0) {
                    compareVal = a.resmut.localeCompare(b.resmut);
                }
            } else if (sortColumn === 'creator') {
                valA = a.creator;
                valB = b.creator;
                compareVal = valA.localeCompare(valB);
            }

            if (compareVal !== 0) {
                if (sortDirection === 'ascending') {
                    return compareVal;
                } else {
                    return -compareVal;
                }
            }

            // Always sort by ID ascending secondarily
            compareVal = a.id - b.id;
            return compareVal;

        })

        return sortedData
    }

    const getVariantDisplay = (resid: any, resnum: any, resmut: any) => {
        if (resnum === 0) {
          return 'WT';
        }
        return `${resid}${resnum}${resmut}`;
    };

    const roundTo = (number:number, decPlaces:number) => {
        if (number === null) {
          return null;
        }
        const factor = Math.pow(10, decPlaces);
        return (Math.round(number * factor) / factor).toFixed(decPlaces);
    };

    const getSelectedIds = () => {
        return Array.from(checkedItems).map(id => typeof id === "string" ? parseInt(id, 10) : id);
    }

    const approveData = () => {
        // TODO: handle checkedItems === "all" properly!
        if (checkedItems === "all") return;
        const selectedIds = getSelectedIds();
        console.log(selectedIds);
        fetch(`/api/curateData`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids: selectedIds, status: viewAs }),
        }).then((response) => {
            if (!response.ok) {  // Checks if response status code is not in the 200-299 range
                throw new Error('Failed to approve data, server responded with ' + response.status);
            }
            // Make approved data invisible
            setViewableData((originalData) => originalData.filter((item) => !selectedIds.includes(item.id) ));
            if (user.status === "ADMIN") {
                if (viewAs === "ADMIN") {
                    // Remove data from page, since it has been fully curated
                    setData((originalData) => originalData.filter((item) => !selectedIds.includes(item.id) ));
                } else {
                    // Just keep data invisible, but update for when viewAs changed to "ADMIN"
                    data.map((item) => {
                        if (selectedIds.includes(item.id)) {
                            item.approved_by_pi = true;
                        }
                        return item;
                    })
                }
            } else {
                // Remove data from page
                setData((originalData) => originalData.filter((item) => !selectedIds.includes(item.id) ));
            }

            removeIdsFromCheckedItems(selectedIds);
            console.log("Successfully approved data.");
        }).catch((error) => {
            console.log(error);
        })
    }

    const rejectData = () => {
        // TODO: handle checkedItems === "all" properly!
        if (checkedItems === "all") return;
        const selectedIds = getSelectedIds();
        console.log(selectedIds);
        fetch(`/api/curateData`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids: selectedIds, status: viewAs }),
        }).then((response) => {
            if (!response.ok) {  // Checks if response status code is not in the 200-299 range
                throw new Error('Failed to reject data, server responded with ' + response.status);
            }
            // Remove data from table and page
            setViewableData((originalData) => originalData.filter((item) => !selectedIds.includes(item.id) ));
            setData((originalData) => originalData.filter((item) => !selectedIds.includes(item.id) ));
            removeIdsFromCheckedItems(selectedIds);
            console.log("Successfully rejected data.");
        }).catch((error) => {
            console.log(error);
        })
    }

    const removeIdsFromCheckedItems = (idsToRemove: number[]) => {
        setCheckedItems(currentItems => {
            const updatedItems = new Set(currentItems);
            idsToRemove.forEach(id => updatedItems.delete(id));
            return updatedItems;
        });
    };

    const isCheckedItemsEmpty = () => {
        if (typeof checkedItems === "string" && checkedItems === "all") {
            return false;
        }
        return checkedItems.size === 0;
    }

    const decodeHTML = (html:string) => {
        return new DOMParser().parseFromString(html, "text/html").documentElement.textContent;
    }

    return (
        <div>
            <NavBar/>
            <AuthChecker minimumStatus={"professor"}>
                <div className="px-3 md:px-4 lg:px-15 py-4 lg:py-10 mb-10 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <Breadcrumbs className="mb-2">
                            <BreadcrumbItem href="/">Home</BreadcrumbItem>
                            <BreadcrumbItem>Database</BreadcrumbItem>
                            <BreadcrumbItem>Bulk Curation of Data</BreadcrumbItem>
                        </Breadcrumbs>
                        <div className="mb-8 lg:mb-20">
                            <h1 className="mb-4 text-4xl md:text-4xl lg:text-4xl font-inter dark:text-white">
                                Bulk Curation of Data
                            </h1>
                            { viewAs === "professor" &&
                                <h2 className="text-xl">Data from the {user?.user_name} Lab or other labs at {user?.institution}</h2>
                            }
                            { viewAs === "ADMIN" &&
                                <h2 className="text-xl">Data from the D2D Network</h2>
                            }
                            <p className='text'>Please approve or reject the data below.</p>
                            {/* <p>{viewableData.length} records of data remain to be curated. Please approve or reject the data below.</p> */}

                            { (user?.status === "ADMIN") &&
                                <div>
                                    <span>You are curating as a {viewAs === "ADMIN" ? "D2D Network Administrator." : "professor."} </span>
                                    <span
                                        className='underline text-blue-500 cursor-pointer'
                                        onClick={() => setViewAs((currentView) => currentView === "ADMIN" ? "professor" : "ADMIN")}
                                    >
                                        Click here to curate data as {viewAs === "ADMIN" ? "the instructor of a laboratory." : "a D2D Network Administrator"}
                                    </span>
                                </div>
                            }
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
                                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                    <Input
                                        isClearable
                                        classNames={{
                                            base: "w-full sm:w-[200px] md:w-[300px]",
                                        }}
                                        placeholder="Search for variant..."
                                        size="sm"
                                        value={searchTerm}
                                        onClear={() => setSearchTerm("")}
                                        onValueChange={(value) => setSearchTerm(value)}
                                        startContent={
                                            <svg
                                                aria-hidden="true"
                                                fill="none"
                                                focusable="false"
                                                height="1em"
                                                stroke="currentColor"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                viewBox="0 0 24 24"
                                                width="1em"
                                            >
                                                <circle cx="11" cy="11" r="8" />
                                                <line x1="21" x2="16.65" y1="21" y2="16.65" />
                                            </svg>
                                        }
                                    />
                                    <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                                        <Dropdown
                                            className="w-full"
                                            shouldBlockScroll={false}
                                            shouldCloseOnInteractOutside={() => false}
                                        >
                                            <DropdownTrigger>
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    className="w-full"
                                                    startContent={<FaColumns className="text-small" />}
                                                >
                                                    Columns
                                                </Button>
                                            </DropdownTrigger>
                                            <DropdownMenu
                                                disallowEmptySelection
                                                aria-label="Table Columns"
                                                closeOnSelect={false}
                                                selectedKeys={visibleColumns}
                                                selectionMode="multiple"
                                                onSelectionChange={(keys) => setVisibleColumns(new Set(Array.from(keys).map(String)))}
                                            >
                                                {columns.map((column) => (
                                                    <DropdownItem key={column.uid}>
                                                        {column.name}
                                                    </DropdownItem>
                                                ))}
                                            </DropdownMenu>
                                        </Dropdown>

                                        <Dropdown
                                            className="w-full"
                                            shouldBlockScroll={false}
                                            shouldCloseOnInteractOutside={() => false}
                                        >
                                            <DropdownTrigger>
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    className="w-full"
                                                    startContent={<FaFilter className="text-small" />}
                                                >
                                                    Filters
                                                </Button>
                                            </DropdownTrigger>
                                            <DropdownMenu
                                                aria-label="Filter options"
                                                className="w-[240px] p-3"
                                                itemClasses={{
                                                    base: [
                                                        "rounded-md",
                                                        "text-gray-700",
                                                        "transition-opacity",
                                                        "data-[hover=true]:bg-transparent",
                                                        "data-[hover=true]:text-gray-900",
                                                        "data-[selected=true]:bg-transparent",
                                                        "data-[selected=true]:text-gray-900",
                                                        "data-[disabled=true]:text-gray-400",
                                                        "border-none",
                                                        "text-sm",
                                                        "py-2"
                                                    ].join(" ")
                                                }}
                                                variant="flat"
                                                closeOnSelect={false}
                                            >
                                                {/* Display Options */}
                                                <DropdownItem className="p-0 mb-2">
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-gray-600">Institution</span>
                                                            <Button
                                                                size="sm"
                                                                variant="light"
                                                                className="text-blue-500 text-sm"
                                                                onPress={() => setSelectedInstitution('')}
                                                            >
                                                                Clear
                                                            </Button>
                                                        </div>
                                                        <Select
                                                            size="sm"
                                                            placeholder="All"
                                                            selectedKeys={selectedInstitution ? [selectedInstitution] : []}
                                                            onChange={(e) => setSelectedInstitution(e.target.value)}
                                                            className="w-full text-sm"
                                                        >
                                                            {[
                                                                <SelectItem key="" value="">All</SelectItem>,
                                                                ...institutions.map((institution: Institution) => (
                                                                <SelectItem
                                                                    key={institution.abbr}
                                                                    value={institution.abbr}
                                                                >
                                                                    {institution.fullname || institution.abbr}
                                                                </SelectItem>
                                                                ))
                                                            ]}
                                                        </Select>
                                                    </div>
                                                </DropdownItem>

                                                <DropdownItem className="p-0 mb-2">
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-gray-600">Non-Submitted Data</span>
                                                            <Button
                                                                size="sm"
                                                                variant="light"
                                                                className="text-blue-500 text-sm"
                                                                onPress={() => setShowNonSubmitted(false)}
                                                            >
                                                                Clear
                                                            </Button>
                                                        </div>
                                                        <Select
                                                            size="sm"
                                                            placeholder="Included"
                                                            selectedKeys={[showNonSubmitted ? "included" : "excluded"]}
                                                            onChange={(e) => setShowNonSubmitted(e.target.value === "included")}
                                                            className="w-full text-sm"
                                                        >
                                                            <SelectItem key="included" value="included">Included</SelectItem>
                                                            <SelectItem key="excluded" value="excluded">Excluded</SelectItem>
                                                        </Select>
                                                    </div>
                                                </DropdownItem>
                                            </DropdownMenu>
                                        </Dropdown>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                    <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                                        <Button
                                            size="sm"
                                            variant="solid"
                                            className="w-full bg-[#06B7DB]"
                                            isDisabled={isCheckedItemsEmpty()}
                                            onClick={approveData}
                                        >
                                            Approve
                                        </Button>

                                        <Dropdown>
                                            <DropdownTrigger>
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    className="w-full"
                                                    endContent={
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                            <path d="M4 6L8 10L12 6" stroke="#11181C" stroke-linecap="round" stroke-linejoin="round"/>
                                                        </svg>
                                                    }
                                                >
                                                    More Actions
                                                </Button>
                                            </DropdownTrigger>
                                            <DropdownMenu
                                                aria-label="More Options"
                                                closeOnSelect={true}
                                                selectionMode="single"
                                            >
                                                <DropdownItem
                                                    color="danger"
                                                    className="text-danger"
                                                >
                                                    Delete Datasets
                                                </DropdownItem>
                                                <DropdownItem>
                                                    Mark as &quot;Awaiting Replication&quot;
                                                </DropdownItem>
                                                <DropdownItem>
                                                    Mark as &quot;Needs Revision&quot;
                                                </DropdownItem>
                                            </DropdownMenu>
                                        </Dropdown>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Table
                                aria-label="Data to Curate"
                                isHeaderSticky
                                selectionMode="multiple"
                                selectedKeys={checkedItems}
                                onSelectionChange={setCheckedItems}
                                sortDescriptor={sortDescriptor}
                                onSortChange={handleColumnClick}
                                className="mb-8 sm:mb-12"
                            >
                                <TableHeader columns={headerColumns}>
                                    {(column) => (
                                        <TableColumn
                                            key={column.uid}
                                            allowsSorting={column.sortable}
                                        >
                                            {column.name}
                                        </TableColumn>
                                    )}
                                </TableHeader>
                                <TableBody
                                    items={viewableData}
                                    isLoading={isLoading}
                                    loadingContent={<Spinner label="Loading..." />}
                                >
                                    {(item) => (
                                        <TableRow key={item.id}>
                                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </AuthChecker>
        </div>


    )
}

export default CuratePage;