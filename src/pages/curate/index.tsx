import React, { useState, useEffect, useCallback } from 'react';
import "../../app/globals.css";
import { useUser } from '@/components/UserProvider';
import { AuthChecker } from '@/components/AuthChecker';
import NavBar from '@/components/NavBar';
import { Breadcrumbs, BreadcrumbItem, Button, Chip, Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/react";
import { Key, Selection, SortDescriptor } from '@react-types/shared';
import Link from 'next/link';

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
    // const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            setViewAs(user.status);
            const response = await fetch('/api/getPendingData');
            const data = await response.json();
            setData(data)
            filterAndSortData(data);
        };
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

    const columns = [
        { name: "STATUS", uid: "status", sortable: false},
        { name: "", uid: "approved_by_pi", sortable: false},
        { name: "ID", uid: "id", sortable: true },
        { name: "Variant", uid: "variant", sortable: true },
        { name: "Creator", uid: "creator", sortable: true },
        { name: "Assay Date", uid: "assay_date", sortable: false},
        { name: "Km", uid: "km", sortable: false },
        { name: "Kcat", uid: "kcat", sortable: false },
        { name: "T50", uid: "t50", sortable: false },
        { name: "Comments", uid: "comments", sortable: false },
        { name: "ACTIONS", uid: "actions", sortable: false }
    ];

    const renderCell = useCallback((data:any, columnKey:Key) => {
        switch (columnKey) {
            case "status":
                {/* TODO: Hard coded rn!! */}
                return (
                    <Chip className="bg-[#E6F1FE] text-[#06B7DB]" variant="flat">
                        In Progress
                    </Chip>
                );
            case "approved_by_pi":
                if (viewAs === "ADMIN" && data.approved_by_pi) {
                    return (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M8 1.90186C4.1 1.90186 1 5.00186 1 8.90186C1 12.8019 4.1 15.9019 8 15.9019C11.9 15.9019 15 12.8019 15 8.90186C15 5.00186 11.9 1.90186 8 1.90186ZM7 11.6022L4.5 9.10225L5.3 8.30225L7 10.0022L10.7 6.30225L11.5 7.10225L7 11.6022ZM2 8.90186C2 12.2019 4.7 14.9019 8 14.9019C11.3 14.9019 14 12.2019 14 8.90186C14 5.60186 11.3 2.90186 8 2.90186C4.7 2.90186 2 5.60186 2 8.90186Z" fill="#17C964"/>
                        </svg>
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
                return data.comments
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
        const sortedData = sortData(filteredData, sortDescriptor)
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

    return (
        <div>
            <NavBar/>
            <AuthChecker minimumStatus={"professor"}>
                <div className="m-24 bg-white">
                    <div className="col-span-1 items-center">
                        <Breadcrumbs className="mb-2">
                            <BreadcrumbItem href="/">Home</BreadcrumbItem>
                            <BreadcrumbItem>Database</BreadcrumbItem>
                            <BreadcrumbItem>Bulk Curation of Data</BreadcrumbItem>
                        </Breadcrumbs>
                        <div className="pt-8">
                            <h1 className="mb-4 text-4xl font-inter md:text-3xl xl:text-4xl dark:text-white">Bulk Curation of Data</h1>
                            { viewAs === "professor" &&
                                <h2 className="text-xl">Data from the {user?.user_name} Lab or other labs at {user?.institution}</h2>
                            }
                            { viewAs === "ADMIN" &&
                                <h2 className="text-xl">Data from the D2D Network</h2>
                            }
                            <p className='text'>Please approve or reject the data below.</p>
                            {/* <p>{viewableData.length} records of data remain to be curated. Please approve or reject the data below.</p> */}

                            { (user?.status === "ADMIN") &&
                                <div className="flex">
                                    <p>You are curating as a {viewAs === "ADMIN" ? "D2D Network Administrator." : "professor."} </p>
                                    <p
                                        className='ml-1 underline text-blue-500 cursor-pointer'
                                        onClick={() => setViewAs((currentView) => currentView === "ADMIN" ? "professor" : "ADMIN")}
                                    >
                                        Click here to curate data as {viewAs === "ADMIN" ? "the instructor of a laboratory." : "a D2D Network Administrator"}
                                    </p>
                                </div>
                            }

                            {/* <div className="flex flex-row items-center my-2">
                                <button
                                    className={`${!Object.values(checkedItems).some(value => value === true) ? "bg-gray-500" : "bg-green-500"} mx-2 p-2 rounded`}
                                    onClick={approveData}
                                    disabled={!Object.values(checkedItems).some(value => value === true)}
                                >
                                    Approve
                                </button>
                                <button
                                    className={`${!Object.values(checkedItems).some(value => value === true) ? "bg-gray-500" : "bg-red-500"} mx-2 p-2 rounded`}
                                    onClick={rejectData}
                                    disabled={!Object.values(checkedItems).some(value => value === true)}
                                >
                                    Reject
                                </button>
                            </div> */}
                        </div>

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
                            <TableHeader columns={columns}>
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
            </AuthChecker>
        </div>


    )
}

export default CuratePage;