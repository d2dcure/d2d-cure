import React, { useState, useEffect, useCallback } from 'react';
import "../../app/globals.css";
import { useUser } from '@/components/UserProvider';
import { AuthChecker } from '@/components/AuthChecker';
import NavBar from '@/components/NavBar';
import StatusChip from '@/components/StatusChip';
import { Breadcrumbs, BreadcrumbItem, Button, Checkbox, Chip, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Select, SelectItem, Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip } from "@nextui-org/react";
import { FaFilter, FaInfoCircle, FaArrowUp, FaArrowDown, FaColumns } from 'react-icons/fa';
import { Key, Selection, SortDescriptor } from '@react-types/shared';
import Link from 'next/link';
import { parse, format } from 'date-fns';

const columns = [
    { name: "Status", uid: "status", sortable: false},
    { name: "ID", uid: "id", sortable: true },
    { name: "Variant", uid: "variant", sortable: true },
    { name: "Creator", uid: "creator", sortable: true },
    { name: "Purification Date", uid: "purification_date", sortable: false},
    { name: "Assay Date", uid: "assay_date", sortable: false},
    { name: "Km", uid: "km", sortable: false },
    { name: "Kcat", uid: "kcat", sortable: false },
    { name: "T50", uid: "t50", sortable: false },
    { name: "Comments", uid: "comments", sortable: false },
    { name: "Actions", uid: "actions", sortable: false }
];

interface StatusChipProps {
    status: 'in_progress' | 'pending_approval' | 'needs_revision' | 'approved' | 'awaiting_replication' | 'pi_approved';
}

// Move parseFormats outside the renderCell function
const dateParseFormats = [
    'M/d/yy', 'MM/d/yy', 'M/dd/yy', 'MM/dd/yy',
    'M/d/yyyy', 'MM/d/yyyy', 'M/dd/yyyy', 'MM/dd/yyyy',
    'yyyy.MM.dd'
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
        "status", "id", "variant", "creator", "purification_date", "assay_date", 
        "km", "kcat", "t50", "comments", "actions"
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
                let status: StatusChipProps['status'];
                if (data.curated) {
                    status = "approved"
                } else if (data.approved_by_pi) {
                    status = "pi_approved"
                } else if (data.submitted_for_curation) {
                    status = "pending_approval"
                } else {
                    status = "in_progress"
                }
                return (
                    <StatusChip status={status} />
                )
            case "id":
                return data.id
            case "variant":
                return getVariantDisplay(data.resid, data.resnum, data.resmut)
            case "creator":
                return (data.creator + " (" + data.pi + " Lab)") 
            case "assay_date": {
                let date = "";
                if (data.tempRawData?.assay_date) {
                    date = data.tempRawData.assay_date;
                }
                if (data.kineticRawData?.assay_date) {
                    date = data.kineticRawData.assay_date;
                }
                if (date === "") {
                    return "N/A";
                }

                // Use shared dateParseFormats
                for (const parseFormat of dateParseFormats) {
                    try {
                        const parsedDate = parse(date, parseFormat, new Date());
                        return format(parsedDate, 'MM/dd/yy');
                    } catch (error) {
                        continue;
                    }
                }
                return date;
            }
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
                    <Link
                        href={data.resid === "X" 
                            ? `/submit/wild_type/${data.id}`
                            : `/submit/single_variant/${data.id}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#06B7DB]"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        View
                    </Link>
                )
            case "purification_date": {
                let purificationDate = "";
                if (data.tempRawData?.purification_date) {
                    purificationDate = data.tempRawData.purification_date;
                }
                if (data.kineticRawData?.purification_date) {
                    purificationDate = data.kineticRawData.purification_date;
                }
                if (purificationDate === "") {
                    return "N/A";
                }

                // Use shared dateParseFormats
                for (const parseFormat of dateParseFormats) {
                    try {
                        const parsedDate = parse(purificationDate, parseFormat, new Date());
                        return format(parsedDate, 'MM/dd/yy');
                    } catch (error) {
                        continue;
                    }
                }
                return purificationDate;
            }
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
            alert('Datasets approved and/or curated successfully');
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
            alert('Datasets rejected and deleted successfully');
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
        if (html === null) return ""
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
                                            {viewAs === "ADMIN" 
                                              ? "Curate"
                                              : "Approve as PI"
                                            }
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
                                                    onClick={rejectData}
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

                        <div className="flex justify-start">
                            <span className='text-default-400 text-sm'>{viewableData.length} Records</span>
                        </div>

                        <div>
                            <Table
                                aria-label="Data to Curate"
                                isHeaderSticky
                                selectionMode="multiple"
                                selectionBehavior="toggle"
                                selectedKeys={checkedItems}
                                onSelectionChange={setCheckedItems}
                                sortDescriptor={sortDescriptor}
                                onSortChange={handleColumnClick}
                                className="mt-2 mb-8 sm:mb-12"
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