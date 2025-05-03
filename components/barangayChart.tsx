import { useEffect, useState } from "react";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, LabelList, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartTooltip, ChartTooltipContent, ChartContainer, useChart, ChartProvider } from "@/components/ui/chart";

// Chart configuration
const chartConfig: ChartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
  label: {
    color: "hsl(var(--background))",
  },
};

export function BarangayChart({ data }) {
  const { setChartConfig } = useChart(chartConfig); // Ensure useChart is used within ChartContainer

  // State for active chart selection (mobile/desktop)
  const [active, setActive] = useState("total");
  const [activeData, setActiveData] = useState([]);
  const [chartHeight, setChartHeight] = useState(600); // Default height set to 3000px

  // Default bar size and gap
  const barSize = 25;
  const barGap = 12;
  const minHeight = 600; // Minimum height set to 3000px (ensures no shrinking)

  // Handler for dropdown selection change
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setActive(event.target.value);
  };

  useEffect(() => {
    if (Object.keys(data).length === 0) return; // Prevent calculation on empty data

    // Dynamically calculate chart height based on the number of data entries
    const calculatedHeight = Math.max(Object.keys(data).length * (barSize + barGap), minHeight); // Ensure at least 3000px height
    setChartHeight(calculatedHeight); // Set calculated height

    // Prepare the active data based on the selected option (total, confirm, declined, undecided)
    const filteredData = Object.entries(data || {}).map(([key, value]) => ({
      month: key,
      value: value[active] || 0, // Ensure there's always a value
    }));

    setActiveData(filteredData);
  }, [data, active]);

  // Set the chart config inside the ChartContainer
  useEffect(() => {
    setChartConfig(chartConfig);
  }, []);

  return (
    <Card className="h-full" style={{}}>
      <CardHeader>
        <CardTitle>Barangay Chart</CardTitle>
        <CardDescription>List as of 2025</CardDescription>

        {/* Dropdown to select active graph (Mobile/Desktop) */}
        <div className="mt-2">
          <select
            value={active}
            onChange={handleSelectChange}
            className="p-2 border rounded-md bg-white"
          >
            <option value="total">ALL</option>
            <option value="confirm">Confirm</option>
            <option value="declined">Declined</option>
            <option value="undecided">Undecided</option>
            <option value="verified">Verified</option>

          </select>
        </div>
      </CardHeader>

      <CardContent style={{ overflowY: "auto", maxHeight: 'auto' }}>
        {activeData.length === 0 ? (
          <p className="text-center text-gray-500">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ChartContainer config={chartConfig} className={`h-[${chartHeight}px]`}>
              <BarChart
                data={activeData} // Use the filtered active data
                layout="vertical"
                barSize={barSize} // Fixed bar size
                barGap={barGap}  // Fixed gap between bars
                margin={{ right: 16 }}
              >
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="month"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)} // Shorten the month name
                  hide
                />
                <XAxis dataKey="value" type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar
                  dataKey="value"
                  layout="vertical"
                  fill={active === "desktop" ? chartConfig.desktop.color : chartConfig.mobile.color}
                  radius={4}
                >
                  <LabelList
                    dataKey="month"
                    position="insideLeft"
                    offset={8}
                    className="fill-[--color-label]"
                    fontSize={12}
                  />
                  <LabelList
                    dataKey="value"
                    position="right"
                    offset={8}
                    className="fill-foreground"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
