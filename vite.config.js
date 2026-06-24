import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  build: {
    chunkSizeWarningLimit: 700,

    rolldownOptions: {
      output: {
        /*
         * Keep module execution order safe when
         * manually separating dependency groups.
         */
        strictExecutionOrder: true,

        codeSplitting: {
          minSize: 0,

          groups: [
            {
              name: "react-vendor",

              test:
                /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/,

              priority: 40,
            },

            {
              name: "router-vendor",

              test:
                /node_modules[\\/](?:react-router|react-router-dom|@remix-run)[\\/]/,

              priority: 35,
            },

            {
              name: "charts-vendor",

              test:
                /node_modules[\\/](?:recharts|d3-[^\\/]+|victory-vendor|react-smooth)[\\/]/,

              priority: 30,
            },

            {
              name: "icons-vendor",

              test:
                /node_modules[\\/]lucide-react[\\/]/,

              priority: 25,
            },
          ],
        },
      },
    },
  },
});
