export interface BorrowerInfo {
    name: string;
    dueDate: string;
}

export interface Book {
    id: string;
    title: string;
    author: string;
    publicationDate: string;
    description?: string;
    available: boolean;
    borrower?: BorrowerInfo;
    createdAt: string;
    updatedAt: string;
}

export interface BookFilters {
    availability?: "available" | "checkedOut";
    dueBefore?: string;
    overdue?: boolean;
}
