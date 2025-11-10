// Tệp này chứa tọa độ trung tâm và mức zoom đề xuất cho các quốc gia trên thế giới.
const countryData = {
    // Châu Á
    'Việt Nam': { lat: 16.047, lon: 108.206, zoom: 6 },
    'Nhật Bản': { lat: 36.204, lon: 138.252, zoom: 5 },
    'Hàn Quốc': { lat: 35.907, lon: 127.766, zoom: 7 },
    'Trung Quốc': { lat: 35.861, lon: 104.195, zoom: 4 },
    'Đài Loan': { lat: 23.697, lon: 120.960, zoom: 7 },
    'Ấn Độ': { lat: 20.593, lon: 78.962, zoom: 5 },
    'Thái Lan': { lat: 15.870, lon: 100.992, zoom: 6 },
    'Philippines': { lat: 12.879, lon: 121.774, zoom: 5 },
    'Malaysia': { lat: 4.210, lon: 101.975, zoom: 6 },
    'Indonesia': { lat: -0.789, lon: 113.921, zoom: 5 },
    
    // Châu Âu
    'Anh': { lat: 54.0, lon: -2.0, zoom: 6 },
    'Pháp': { lat: 46.227, lon: 2.213, zoom: 6 },
    'Đức': { lat: 51.165, lon: 10.451, zoom: 6 },
    'Hà Lan': { lat: 52.132, lon: 5.291, zoom: 7 },
    'Đan Mạch': { lat: 56.263, lon: 9.501, zoom: 7 },
    'Na Uy': { lat: 60.472, lon: 8.468, zoom: 5 },
    'Thụy Điển': { lat: 60.128, lon: 18.643, zoom: 5 },
    'Phần Lan': { lat: 61.924, lon: 25.748, zoom: 5 },
    'Ba Lan': { lat: 51.919, lon: 19.145, zoom: 6 },
    'Tây Ban Nha': { lat: 40.463, lon: -3.749, zoom: 6 },
    'Bồ Đào Nha': { lat: 39.399, lon: -8.224, zoom: 7 },
    'Ý': { lat: 41.871, lon: 12.567, zoom: 6 },
    'Ireland': { lat: 53.412, lon: -8.243, zoom: 7 },
    'Bỉ': { lat: 50.503, lon: 4.469, zoom: 8 },

    // Châu Mỹ
    'Mỹ': { lat: 39.828, lon: -98.579, zoom: 4 },
    'Canada': { lat: 56.130, lon: -106.346, zoom: 3 },
    'Brazil': { lat: -14.235, lon: -51.925, zoom: 4 },
    'Argentina': { lat: -38.416, lon: -63.616, zoom: 4 },
    'Chile': { lat: -35.675, lon: -71.542, zoom: 4 },
    'Mexico': { lat: 23.634, lon: -102.552, zoom: 5 },
    'Colombia': { lat: 4.570, lon: -74.297, zoom: 5 },

    // Châu Đại Dương
    'Úc': { lat: -25.274, lon: 133.775, zoom: 4 },
    'New Zealand': { lat: -40.900, lon: 174.885, zoom: 5 },

    // Châu Phi
    'Nam Phi': { lat: -30.559, lon: 22.937, zoom: 5 },
    'Ai Cập': { lat: 26.820, lon: 30.802, zoom: 6 },
    'Maroc': { lat: 31.791, lon: -7.092, zoom: 6 },
    'Kenya': { lat: -0.023, lon: 37.906, zoom: 6 }
};