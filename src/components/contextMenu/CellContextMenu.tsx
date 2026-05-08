import { CellContext } from "@tanstack/react-table";
import { RowDataType } from "cdm/FolderModel";
import { showFileMenu } from "components/obsidianArq/commands";
import Relationship from "components/RelationShip";
import {
  ContextMenuAction,
  EMITTERS_GROUPS,
  StyleVariables,
} from "helpers/Constants";
import { c } from "helpers/StylesHelper";
import { Literal } from "obsidian-dataview";
import React, { MouseEventHandler } from "react";
import KeyboardControlKeyIcon from "@mui/icons-material/KeyboardControlKey";

export default function CellContextMenu(
  context: CellContext<RowDataType, Literal>
) {
  const { row, table } = context;
  const { tableState, view } = table.options.meta;
  const rowActions = tableState.data((state) => state.actions);

  /**
   * Handle left click
   * @param event
   */
  const handleClick: MouseEventHandler<HTMLDivElement> = async (event) => {
    if (event.shiftKey) {
      // SHIFT + CLICK
      if (
        table.getSelectedRowModel().rows.length === 1 &&
        row.getIsSelected()
      ) {
        view.emitter.emit(EMITTERS_GROUPS.CONTEXT_HEADER, {
          action: ContextMenuAction.DEFAULT,
        });
      } else {
        view.emitter.emit(EMITTERS_GROUPS.CONTEXT_HEADER, {
          action: ContextMenuAction.SELECT,
        });
      }
      row.toggleSelected(!row.getIsSelected());
    } else {
      row.toggleExpanded(!row.getIsExpanded());
    }
  };

  /**
   * Handle right click
   * @param event
   */
  const handlerContextMenu = async (event: React.MouseEvent<HTMLElement>) => {
    showFileMenu(
      row.original.__note__.getFile(),
      event.nativeEvent,
      row,
      rowActions
    );
  };

  // Compute display row number from pagination state (indexOf has reference mismatch bug)
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const pageLocalIndex = table.getPaginationRowModel().rows.indexOf(row);
  const index = pageLocalIndex >= 0
    ? pageIndex * pageSize + pageLocalIndex + 1
    : row.index + 1; // fallback

  return (
    <>
      <div
        onClick={handleClick}
        onContextMenu={handlerContextMenu}
        key={`row-context-button-${index}`}
        className={c(`cell-context-button`)}
      >
        {row.getIsExpanded() ? (
          <KeyboardControlKeyIcon
            sx={{
              fontSize: "1.5rem",
            }}
          />
        ) : (
          <Relationship
            option={{
              label: index.toString(),
              value: index.toString(),
              color: StyleVariables.BACKGROUND_PRIMARY,
            }}
            view={view}
          />
        )}
      </div>
    </>
  );
}
