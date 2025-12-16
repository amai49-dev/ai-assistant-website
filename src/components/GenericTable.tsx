
import { Column } from "../utils/tableConfig";

type Props<T> = {
    data: T[]
    columns: Column<T>[]
}

export default function GenericTable<T>({ data, columns }: Props<T>) {
    if (!data.length) return <p>ไม่มีข้อมูล</p>

    return (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr>
                    {columns.map(col => (
                        <th key={col.key as string}>
                            <strong>{col.label}</strong>
                        </th>
                    ))}
                </tr>
            </thead>

            <tbody>
                {data.map((row, i) => (
                    <tr key={i}>
                        {columns.map(col => {
                            const value = (row as any)[col.key]

                            const content = col.render
                                ? col.render(value, row)
                                : value

                            return (
                                <td key={col.key as string}>
                                    {col.bold ? <strong>{content}</strong> : content}
                                </td>
                            )
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
