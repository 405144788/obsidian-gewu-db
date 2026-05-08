import Relationship from "components/RelationShip";
import React, { useMemo, useState } from "react";
import {
  CellComponentProps,
  ColumnOption,
  SelectValue,
} from "cdm/ComponentsModel";
import { TableColumn } from "cdm/FolderModel";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import CustomTagsStyles from "components/styles/TagsStyles";
import { c, getAlignmentClassname } from "helpers/StylesHelper";
import { satinizedColumnOption } from "helpers/FileManagement";
import { ActionMeta, OnChangeValue } from "react-select";
import { ParseService } from "services/ParseService";
import { OptionSource } from "helpers/Constants";
import { Db } from "services/CoreService";

const SelectCell = React.memo(function SelectCell(popperProps: CellComponentProps) {
  const { defaultCell } = popperProps;
  const { row, column, table } = defaultCell;
  const { tableState, view } = table.options.meta;
  const tableColumn = column.columnDef as TableColumn;

  // Read value directly — no subscription
  const cellValue = (defaultCell.getValue() ?? "") as string;
  const localSettings = tableState.configState.getState().info.getLocalSettings();
  const columnOptions = tableState.columns.getState().info.getColumnOptions(column.id);
  const [showSelect, setShowSelect] = useState(false);

  function mapOption() {
    const match = columnOptions.find((option) => option.value === cellValue);
    if (match) return match;
    // New select — generate random color
    const option: ColumnOption = {
      label: cellValue,
      value: cellValue,
      color: Db.coreFns.colors.randomColor(),
    };
    tableState.columns.getState().actions.addOptionToColumn(tableColumn, option);
    return option;
  }

  const defaultValue = useMemo(() => mapOption(), [cellValue]);

  const handleOnChange = async (
    newValue: OnChangeValue<SelectValue, false>,
    actionMeta: ActionMeta<ColumnOption>
  ) => {
    const sanitized = satinizedColumnOption(newValue ? newValue.value.toString() : "");
    const store = tableState.data.getState();
    const selectRow = tableState.data.getState().rows[row.index];
    const columnsInfo = tableState.columns.getState().info;
    const configInfo = tableState.configState.getState().info;

    const newCell = ParseService.parseRowToLiteral(selectRow, tableColumn, sanitized);

    await tableState.data.getState().actions.updateCell({
      rowIndex: row.index,
      column: tableColumn,
      value: newCell,
      columns: columnsInfo.getAllColumns(),
      ddbbConfig: configInfo.getLocalSettings(),
      isMovingFile: true,
    });

    if (actionMeta.action === "create-option") {
      const option: ColumnOption = { label: sanitized, value: sanitized, color: Db.coreFns.colors.randomColor() };
      await tableState.columns.getState().actions.addOptionToColumn(tableColumn, option);
    }
  };

  const options = tableState.columns.getState().info.getColumnOptions(column.id, cellValue !== "");

  function SelectComponent() {
    const selectProps = {
      defaultValue,
      isSearchable: true,
      autoFocus: true,
      isClearable: true,
      openMenuOnFocus: true,
      menuPosition: "fixed" as const,
      styles: CustomTagsStyles,
      options,
      onMenuClose: () => setShowSelect(false),
      onChange: handleOnChange,
      isMulti: false,
      menuPortalTarget: activeDocument.body,
      menuPlacement: "auto" as const,
      menuShouldBlockScroll: true,
      className: `react-select-container ${c("tags-container text-align-center")}`,
      classNamePrefix: "react-select",
      key: `${tableColumn.id}-select-open`,
    };
    return (
      <div className={c("tags")}>
        {tableColumn.config.option_source === OptionSource.FORMULA ? (
          <Select {...selectProps} components={{ DropdownIndicator: () => null, IndicatorSeparator: () => null, ClearIndicator: () => null, CrossIcon: () => null }} />
        ) : (
          <CreatableSelect {...selectProps} components={{ DropdownIndicator: () => null, IndicatorSeparator: () => null, ClearIndicator: () => null, CrossIcon: () => null }} />
        )}
      </div>
    );
  }

  return (
    <>
      {showSelect ? (
        <SelectComponent />
      ) : (
        <div
          className={c(getAlignmentClassname(tableColumn.config, localSettings, ["tabIndex"]))}
          onDoubleClick={() => setShowSelect(true)}
          style={{ width: column.getSize() }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              setShowSelect(true);
            }
          }}
          tabIndex={0}
        >
          {cellValue ? <Relationship option={defaultValue} view={view} /> : null}
        </div>
      )}
    </>
  );
});

export default SelectCell;
