import { motion } from "framer-motion";

export default function AdminSettings() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="px-8 py-6"
    >
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Settings</h1>
      <div className="rounded-lg bg-card shadow-card p-6">
        <p className="text-sm text-muted-foreground">System configuration and product access management will be available here.</p>
      </div>
    </motion.div>
  );
}
