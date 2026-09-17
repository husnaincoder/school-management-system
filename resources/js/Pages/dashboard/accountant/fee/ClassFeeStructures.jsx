import ClassFeeStructuresIndex from '../../fee/ClassFeeStructuresIndex';

/**
 * Accountant fee structures page — same as fee/ClassFeeStructuresIndex but
 * normalizes paginated feeStructures so the shared component receives an array.
 */
export default function ClassFeeStructures(props) {
    const feeStructures = Array.isArray(props.feeStructures)
        ? props.feeStructures
        : (props.feeStructures?.data ?? []);
    return <ClassFeeStructuresIndex {...props} feeStructures={feeStructures} />;
}
