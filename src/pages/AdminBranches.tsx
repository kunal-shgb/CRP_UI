import { motion } from "framer-motion";
import { BRANCHES, BRANCH_RO_MAP, REGIONAL_OFFICES } from "@/lib/mock-data";

export default function AdminBranches() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="px-8 py-6"
    >
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Branch Mapping</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {REGIONAL_OFFICES.map(ro => {
          const branches = BRANCHES.filter(b => BRANCH_RO_MAP[b] === ro);
          return (
            <div key={ro} className="rounded-lg bg-card shadow-card p-6">
              <h2 className="text-base font-medium mb-1">{ro}</h2>
              <p className="text-xs text-muted-foreground mb-4">{branches.length} branches mapped</p>
              <div className="space-y-2">
                {branches.map(b => (
                  <div key={b} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-sm">{b}</span>
                    <span className="text-xs text-muted-foreground">{ro}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
