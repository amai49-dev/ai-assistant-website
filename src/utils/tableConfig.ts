export type Column<T> = {
    key: keyof T | string
    label: string
    bold?: boolean
    render?: (value: any, row: T) => React.ReactNode
}
