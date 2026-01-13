import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';

interface CategoryBreakdownChartProps {
  stats: { status: string; count: number }[];
}

export function CategoryBreakdownChart({ stats }: CategoryBreakdownChartProps) {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const { width } = Dimensions.get('window');

  const totalCount = stats.reduce((sum, stat) => sum + stat.count, 0);

  // Map our status categories to the display format
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Mokantar':
        return {
          title: t('mokantar'),
          icon: 'star',
          color: '#15803d',
          description: t('consistentAndComplete'),
        };
      case 'Qanet':
        return {
          title: t('qanet'),
          icon: 'check-circle',
          color: '#2563eb',
          description: t('regularPractice'),
        };
      case 'Not Negligent':
        return {
          title: t('notNegligent'),
          icon: 'clock',
          color: '#ca8a04',
          description: t('occasionalGaps'),
        };
      case 'Negligent':
        return {
          title: t('negligent'),
          icon: 'alert-circle',
          color: '#dc2626',
          description: t('irregularPractice'),
        };
      default:
        return {
          title: t('unknownStatus'),
          icon: 'circle',
          color: theme.textSecondary,
          description: t('unknownStatus'),
        };
    }
  };

  const styles = createStyles(theme, isRTL);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('categoryBreakdown')}</Text>
        <Text style={styles.subtitle}>{t('prayerConsistencyAnalysis')}</Text>
      </View>

      <View style={styles.grid}>
        {stats.map((stat, index) => {
          const config = getStatusConfig(stat.status);
          const percentage =
            totalCount > 0 ? Math.round((stat.count / totalCount) * 100) : 0;
          
          return (
            <View key={stat.status} style={styles.card}>
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: config.color + '20' },
                  ]}
                >
                  <Feather
                    name={config.icon as any}
                    size={20}
                    color={config.color}
                  />
                </View>
                <Text style={styles.cardTitle}>{config.title}</Text>
              </View>

              <Text style={styles.percentage}>{percentage}%</Text>
              <Text style={styles.count}>{stat.count} {t('days')}</Text>
              <Text style={styles.description}>{config.description}</Text>

              <View style={styles.barContainer}>
                <View style={styles.barBackground}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${percentage}%`,
                        backgroundColor: config.color,
                      },
                    ]}
                  />
                </View>
                <View style={styles.barIndicators}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.barIndicator,
                        {
                          backgroundColor:
                            i < percentage / 20 ? config.color : theme.border,
                          opacity: i < percentage / 20 ? 1 : 0.3,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {t('basedOnTotalPrayerSessions', { count: totalCount })}
        </Text>
      </View>
    </View>
  );
}

const createStyles = (theme: any, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    header: {
      marginBottom: 20,
      alignItems: isRTL ? 'flex-end' : 'flex-start',
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 4,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    grid: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    card: {
      backgroundColor: theme.background,
      borderRadius: 12,
      padding: 16,
      width: '48%',
      minHeight: 140,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 8,
      marginLeft: isRTL ? 8 : 0,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
      flex: 1,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    percentage: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 4,
      textAlign: isRTL ? 'right' : 'left',
    },
    count: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 8,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    description: {
      fontSize: 11,
      color: theme.textSecondary,
      marginBottom: 12,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    barContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
    },
    barBackground: {
      flex: 1,
      height: 4,
      backgroundColor: theme.border,
      borderRadius: 2,
      overflow: 'hidden',
      flexDirection: isRTL ? 'row-reverse' : 'row',
    },
    barFill: {
      height: '100%',
      borderRadius: 2,
    },
    barIndicators: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 2,
    },
    barIndicator: {
      width: 3,
      height: 12,
      borderRadius: 1.5,
    },
    footer: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      alignItems: 'center',
    },
    footerText: {
      fontSize: 12,
      color: theme.textSecondary,
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
  });
