const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await seedSfuServers();
  await seedSystemSettings();
}

async function seedSfuServers() {
  const presets = [
    { id: 'de', name: 'Germany (Frankfurt)', url: 'wss://de-shpion.pr0d.ru/' },
    { id: 'eu', name: 'Local (EU)', url: 'wss://eu-shpion.pr0d.ru/' },
  ];

  // Удаляем все существующие записи, чтобы база содержала _только_ эти пресеты
  await prisma.sfuServer.deleteMany();

  // Массовое создание (одним запросом быстрее, чем upsert поштучно)
  await prisma.sfuServer.createMany({ data: presets });
  console.log('✅  SFU presets seeded');
}

async function seedSystemSettings() {
  const systemSettings = [
    {
      id: 1,
      code_name: 'DEEPFILTER_ATTEN_LIM',
      description: 'Максимальное затухание в дБ',
      value: '40',
    },
    {
      id: 2,
      code_name: 'DEEPFILTER_POSTFILTER_BETA',
      description: 'spectral subtraction post-filter',
      value: '0.05',
    },
    {
      id: 3,
      code_name: 'DEEPFILTER_OUTPUT_GAIN',
      description: 'Linear gain applied AFTER noise suppression (1 = 0 dB)',
      value: '1.2',
    },
    {
      id: 4,
      code_name: 'DEEPFILTER_SAB_RING_CAPACITY',
      description: 'Размер буфера для стартовой стабилизации',
      value: '32',
    },
    {
      id: 5,
      code_name: 'COMPRESSOR_THRESHOLD',
      description: `The threshold property of the DynamicsCompressorNode interface is a k-rate AudioParam representing the decibel value above which the compression will start taking effect. \nThe threshold property's default value is -24 and it can be set between -100 and 0.`,
      value: '-24',
    },
    {
      id: 6,
      code_name: 'COMPRESSOR_KNEE',
      description: `The knee property of the DynamicsCompressorNode interface is a k-rate AudioParam containing a decibel value representing the range above the threshold where the curve smoothly transitions to the compressed portion. \nThe knee property's default value is 30 and it can be set between 0 and 40.`,
      value: '30',
    },
    {
      id: 7,
      code_name: 'COMPRESSOR_RATIO',
      description: `The ratio property of the DynamicsCompressorNode interface Is a k-rate AudioParam representing the amount of change, in dB, needed in the input for a 1 dB change in the output. \nThe ratio property's default value is 12 and it can be set between 1 and 20.`,
      value: '4',
    },
    {
      id: 8,
      code_name: 'COMPRESSOR_ATTACK',
      description: `The attack property of the DynamicsCompressorNode interface is a k-rate AudioParam representing the amount of time, in seconds, required to reduce the gain by 10 dB. It defines how quickly the signal is adapted when its volume is increased. \nThe attack property's default value is 0.003 and it can be set between 0 and 1.`,
      value: '0.003',
    },
    {
      id: 9,
      code_name: 'COMPRESSOR_RELEASE',
      description: `The release property of the DynamicsCompressorNode interface Is a k-rate AudioParam representing the amount of time, in seconds, required to increase the gain by 10 dB. It defines how quick the signal is adapted when its volume is reduced. \nThe release property's default value is 0.25 and it can be set between 0 and 1.`,
      value: '0.25',
    },
    {
      id: 10,
      code_name: 'AUDIO_ECHO_CANCELLATION',
      description: 'Выключение эхо-компенсации, boolean',
      value: '0',
    },
    {
      id: 11,
      code_name: 'AUDIO_NOISE_SUPPRESSION',
      description: 'Выключение шумоподавления, boolean',
      value: '0',
    },
    {
      id: 12,
      code_name: 'AUDIO_AUTO_GAIN_CONTROL',
      description: 'Выключение автоматического усиления, boolean',
      value: '0',
    },
    {
      id: 13,
      code_name: 'AUDIO_VOICE_ISOLATION',
      description: 'Выключение изоляции голоса, boolean',
      value: '0',
    },
    {
      id: 14,
      code_name: 'LIVEKIT_ADAPTIVE_STREAM',
      description: 'Включение адаптивного потока, boolean',
      value: '0',
    },
    {
      id: 15,
      code_name: 'LIVEKIT_DYNACAST',
      description: 'Включение динакаста, boolean',
      value: '0',
    },

    {
      id: 16,
      code_name: 'LIVEKIT_VIDEO_PRESET',
      description: 'Настройки пресетов LiveKit',
      value: 'balanced',
    },
    {
      id: 17,
      code_name: 'LIVEKIT_VIDEO_CODEC_BALANCED',
      description: 'Кодек видео: "vp8" | "h264" | "vp9" | "av1" | "h265"',
      value: 'av1',
    },
    {
      id: 18,
      code_name: 'LIVEKIT_VIDEO_ENCODING_MAX_BITRATE_BALANCED',
      description: 'Максимальная битрейт видео',
      value: '3000000',
    },
    {
      id: 19,
      code_name: 'LIVEKIT_VIDEO_ENCODING_MAX_FRAMERATE_BALANCED',
      description: 'Максимальная частота кадров видео',
      value: '30',
    },
    {
      id: 20,
      code_name: 'LIVEKIT_VIDEO_ENCODING_PRIORITY_BALANCED',
      description: 'Приоритет видео: "high" | "low" | "medium" | "very-low"',
      value: 'high',
    },
    {
      id: 21,
      code_name: 'LIVEKIT_SCREEN_SHARE_ENCODING_MAX_BITRATE_BALANCED',
      description: 'Максимальная битрейт демонстрации экрана',
      value: '3000000',
    },
    {
      id: 22,
      code_name: 'LIVEKIT_SCREEN_SHARE_ENCODING_MAX_FRAMERATE_BALANCED',
      description: 'Максимальная частота кадров демонстрации экрана',
      value: '30',
    },
    {
      id: 23,
      code_name: 'LIVEKIT_SCREEN_SHARE_ENCODING_PRIORITY_BALANCED',
      description:
        'Приоритет демонстрации экрана: "high" | "low" | "medium" | "very-low"',
      value: 'high',
    },
    {
      id: 24,
      code_name: 'LIVEKIT_AUDIO_MAX_BITRATE',
      description: 'Настройки аудио',
      value: '24000',
    },
    {
      id: 25,
      code_name: 'LIVEKIT_AUDIO_DTX',
      description: 'Включение DTX, boolean',
      value: '1',
    },
    {
      id: 26,
      code_name: 'LIVEKIT_AUDIO_RED',
      description: 'Включение RED, boolean',
      value: '0',
    },
    {
      id: 27,
      code_name: 'LIVEKIT_DEGRADATION_PREFERENCE',
      description:
        'Настройки деградации: "balanced" | "maintain-framerate" | "maintain-resolution"',
      value: 'maintain-framerate',
    },
    {
      id: 28,
      code_name: 'LIVEKIT_SIMULCAST',
      description:
        'When using simulcast, LiveKit will publish up to three versions of the stream at various resolutions, boolean',
      value: '1',
    },
    {
      id: 29,
      code_name: 'PREVIEW_CAPTURE_INTERVAL',
      description: 'Интервал захвата превью',
      value: '1000',
    },

    {
      id: 30,
      code_name: 'MAX_SCREEN_SHARES',
      description: 'Максимальное количество одновременных демонстраций экрана',
      value: '4',
    },
  ];

  await Promise.all(
    systemSettings.map((setting) =>
      prisma.systemSetting.upsert({
        where: { id: setting.id },
        create: setting,
        update: {
          code_name: setting.code_name,
          value: setting.value,
          description: setting.description,
        },
      })
    )
  );

  console.log('✅  System settings seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
