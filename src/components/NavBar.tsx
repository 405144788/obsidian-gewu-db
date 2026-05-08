import React, { useEffect } from "react";
import { NavBarProps } from "cdm/MenuBarModel";
import GlobalFilter from "components/reducers/GlobalFilter";
import {
  EMITTERS_BAR_STATUS,
  EMITTERS_GROUPS,
  StyleVariables,
} from "helpers/Constants";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import { c } from "helpers/StylesHelper";
import EditFiltersButton from "components/reducers/DataviewFilters";
import AppBar from "@mui/material/AppBar";
import ToggleFiltersButton from "components/reducers/ToggleFiltersButton";
import Paper from "@mui/material/Paper";
import QuickFilters from "components/reducers/QuickFilters";

export function NavBar(navBarProps: NavBarProps) {
  const { table } = navBarProps;
  const { view, tableState } = table.options.meta;
  const isNavbarEnabled = tableState.configState(
    (state) => state.ephimeral.enable_navbar
  );
  // Subscribe to Zustand row count so status bar updates when data loads
  const totalRows = tableState.data((state) => state.rows.length);
  const filteredRows = table.getFilteredRowModel().rows.length;

  const updateBar = () => {
    if (!view.plugin.statusBarItem) {
      view.plugin.statusBarItem = view.plugin.addStatusBarItem();
    }
    view.plugin.statusBarItem.replaceChildren();
    view.plugin.statusBarItem.createEl("span", {
      text: `${filteredRows}/${totalRows} '${view.diskConfig.yaml.name}'`,
    });
  };

  // Bar status control — update when row count changes
  useEffect(() => {
    updateBar();
  }, [totalRows]);

  useEffect(() => {
    const updateBarAfterActive = (e: string) => {
      if (e === EMITTERS_BAR_STATUS.UPDATE) {
        updateBar();
      }
    };
    view.emitter.on(EMITTERS_GROUPS.BAR_STATUS, updateBarAfterActive);
    return () => {
      view.emitter.off(EMITTERS_GROUPS.BAR_STATUS, updateBarAfterActive);
    };
  }, []);

  return (
    <Box
      sx={{ flexGrow: 1 }}
      style={{
        width: "100%",
      }}
    >
      <AppBar
        position="sticky"
        style={{
          color: StyleVariables.TEXT_MUTED,
          backgroundColor: StyleVariables.BACKGROUND_SECONDARY,
          boxShadow: "none",
        }}
      >
        <Toolbar className={`${c("toolbar-navbar")}`}>
          <Paper
            sx={{
              p: "2px 4px",
              display: "flex",
              alignItems: "center",
              scale: 0.7,
              padding: 0,
              boxShadow: "none",
              backgroundColor: "transparent",
            }}
          >
            {/** Global filter */}
            {isNavbarEnabled && (
              <GlobalFilter {...navBarProps.globalFilterRows} />
            )}
            <ToggleFiltersButton table={table} />
            <EditFiltersButton table={table} />
          </Paper>
          <Box
            sx={{
              overflowX: "auto",
              display: "flex",
              padding: { xs: "0", md: "5px" },
              width: "100%",
            }}
          >
            <QuickFilters table={table} key={`ButtonGroup-QuickFilters`} />
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
}

export function HeaderNavBar(headerNavBarProps: NavBarProps) {
  const { table } = headerNavBarProps;
  const { tableState } = table.options.meta;
  const isNavbarEnabled = tableState.configState(
    (state) => state.ephimeral.enable_navbar
  );

  return (
    <div
      className={`${c("navbar")}`}
      key="div-navbar-header-cell"
      style={{
        display: isNavbarEnabled ? "flex" : "none",
      }}
    >
      <NavBar {...headerNavBarProps} />
    </div>
  );
}
