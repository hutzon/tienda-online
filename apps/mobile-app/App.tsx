import { SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";

const appEnv = process.env.EXPO_PUBLIC_APP_ENV ?? "local";
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.card}>
        <Text style={styles.badge}>Mobile Bootstrap</Text>
        <Text style={styles.title}>TiendaOnline Mobile App</Text>
        <Text style={styles.body}>
          La app móvil quedó inicializada para validar Expo, TypeScript y entorno
          local sin adelantar lógica de negocio.
        </Text>
        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaLabel}>Entorno</Text>
            <Text style={styles.metaValue}>{appEnv}</Text>
          </View>
          <View>
            <Text style={styles.metaLabel}>API prevista</Text>
            <Text style={styles.metaValue}>{apiBaseUrl}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc"
  },
  card: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    fontWeight: "700"
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
    color: "#0f172a"
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: "#334155"
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16
  },
  metaLabel: {
    fontSize: 13,
    color: "#64748b"
  },
  metaValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a"
  }
});
