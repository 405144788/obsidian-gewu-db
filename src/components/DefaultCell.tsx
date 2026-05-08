import React from "react";
import { InputType } from "helpers/Constants";
import { LOGGER } from "services/Logger";
import { RowDataType, TableColumn } from "cdm/FolderModel";
import SelectCell from "components/cellTypes/SelectCell";
import CalendarCell from "components/cellTypes/CalendarCell";
import CalendarTimeCell from "components/cellTypes/CalendarTimeCell";
import CheckboxCell from "components/cellTypes/CheckboxCell";
import TaskCell from "components/cellTypes/TaskCell";
import MarkdownCell from "components/cellTypes/MarkdownCell";
import TagsCell from "components/cellTypes/TagsCell";
import NumberCell from "components/cellTypes/NumberCell";
import TextCell from "components/cellTypes/TextCell";
import MetadataTimeCell from "components/cellTypes/MetadataTimeCell";
import InOutLinksCell from "components/cellTypes/InOutLinksCell";
import FormulaCell from "components/cellTypes/FormulaCell";
import RelationCell from "components/cellTypes/RelationCell";
import RollupCell from "components/cellTypes/RollupCell";
import ImageCell from "components/cellTypes/ImageCell";
import { CellContext } from "@tanstack/react-table";
import { Literal } from "obsidian-dataview";
import MetadataTagsCell from "./cellTypes/MetadataTagsCell";

const DefaultCell = function DefaultCell(
  defaultCell: CellContext<RowDataType, Literal>
) {
  const { column } = defaultCell;
  const input = (column.columnDef as TableColumn).input;

  switch (input) {
    case InputType.TEXT:
      return <TextCell defaultCell={defaultCell} />;
    case InputType.NUMBER:
      return <NumberCell defaultCell={defaultCell} />;
    case InputType.MARKDOWN:
      return <MarkdownCell defaultCell={defaultCell} />;
    case InputType.CALENDAR:
      return <CalendarCell defaultCell={defaultCell} />;
    case InputType.CALENDAR_TIME:
      return <CalendarTimeCell defaultCell={defaultCell} />;
    case InputType.METATADA_TIME:
      return <MetadataTimeCell defaultCell={defaultCell} />;
    case InputType.SELECT:
      return <SelectCell defaultCell={defaultCell} />;
    case InputType.TAGS:
      return <TagsCell defaultCell={defaultCell} />;
    case InputType.TASK:
      return <TaskCell defaultCell={defaultCell} />;
    case InputType.INLINKS:
    case InputType.OUTLINKS:
      return <InOutLinksCell defaultCell={defaultCell} />;
    case InputType.METADATA_TAGS:
      return <MetadataTagsCell defaultCell={defaultCell} />;
    case InputType.CHECKBOX:
      return <CheckboxCell defaultCell={defaultCell} />;
    case InputType.FORMULA:
      return <FormulaCell defaultCell={defaultCell} />;
    case InputType.RELATION:
      return <RelationCell defaultCell={defaultCell} />;
    case InputType.ROLLUP:
      return <RollupCell defaultCell={defaultCell} />;
    case InputType.IMAGE:
      return <ImageCell defaultCell={defaultCell} />;
    case InputType.NEW_COLUMN:
      break;
    default:
      LOGGER.warn(`Unknown input type: ${input}`);
  }
  return <span></span>;
}

export default DefaultCell;
