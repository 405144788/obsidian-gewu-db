import { CellComponentProps } from "cdm/ComponentsModel";
import { TableColumn } from "cdm/FolderModel";
import { SUGGESTER_REGEX } from "helpers/Constants";
import { c, getAlignmentClassname } from "helpers/StylesHelper";
import React, {
  ChangeEventHandler,
  KeyboardEventHandler,
  useState,
} from "react";
import { ParseService } from "services/ParseService";

const NumberCell = React.memo(function NumberCell(props: CellComponentProps) {
  const { defaultCell } = props;
  const { row, column, table } = defaultCell;
  const { tableState } = table.options.meta;
  const tableColumn = column.columnDef as TableColumn;

  const numberCell = defaultCell.getValue() as number;
  const [editableValue, setEditableValue] = useState<string | null>(null);
  const [dirtyCell, setDirtyCell] = useState(false);

  const localSettings = tableState.configState.getState().info.getLocalSettings();

  const handleEditableOnclick = () => {
    setDirtyCell(true);
    setEditableValue(numberCell?.toString() ?? "");
  };

  const handleOnChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setEditableValue(event.target.value);
  };

  async function persistChange(changedValue: number) {
    const store = tableState.data.getState();
    const dataActions = tableState.data.getState().actions;
    const numberRow = tableState.data.getState().rows[row.index];
    const newCell = ParseService.parseRowToLiteral(numberRow, tableColumn, changedValue);
    await dataActions.updateCell({
      rowIndex: row.index,
      column: tableColumn,
      value: newCell,
      columns: tableState.columns.getState().info.getAllColumns(),
      ddbbConfig: tableState.configState.getState().info.getLocalSettings(),
    });
  }

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    } else if (event.key === "Escape") {
      setDirtyCell(false);
    }
  };

  const handleOnBlur = async () => {
    if (editableValue !== null && parseFloat(editableValue) !== numberCell) {
      await persistChange(parseFloat(editableValue));
    }
    setDirtyCell(false);
  };

  return dirtyCell ? (
    <input
      autoFocus
      value={editableValue ?? ""}
      onChange={handleOnChange}
      onKeyDown={handleKeyDown}
      onBlur={handleOnBlur}
      className={c(getAlignmentClassname(tableColumn.config, localSettings))}
    />
  ) : (
    <span
      className={c(getAlignmentClassname(tableColumn.config, localSettings, ["tabIndex"]))}
      onDoubleClick={handleEditableOnclick}
      style={{ width: column.getSize() }}
      onKeyDown={(e) => {
        if (SUGGESTER_REGEX.CELL_VALID_KEYDOWN.test(e.key)) {
          handleEditableOnclick();
        } else if (e.key === "Enter") {
          e.preventDefault();
          handleEditableOnclick();
        }
      }}
      tabIndex={0}
    >
      {isNaN(numberCell) ? "" : numberCell}
    </span>
  );
});

export default NumberCell;
