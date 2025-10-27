export const isOverdue = (dueDate: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    if (Number.isNaN(due.getTime())) {
        return false;
    }
    return due < today;
};

export const isValidDate = (value: string): boolean => {
    const parsed = new Date(value);
    return !Number.isNaN(parsed.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(value);
};
