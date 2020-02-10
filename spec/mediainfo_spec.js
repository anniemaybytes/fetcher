parseXml = require('../core/mediainfo').parseXml;

describe('mediainfo parsing', function() {
  describe("parseXml", function() {
    var infos = [
      '<?xml version="1.0" encoding="UTF-8"?>\
<MediaInfo\
    xmlns="https://mediaarea.net/mediainfo"\
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\
    xsi:schemaLocation="https://mediaarea.net/mediainfo https://mediaarea.net/mediainfo/mediainfo_2_0.xsd"\
    version="2.0">\
<creatingLibrary version="19.09" url="https://mediaarea.net/MediaInfo">MediaInfoLib</creatingLibrary>\
<media ref="[DameDesuYo] ReZero kara Hajimeru Isekai Seikatsu (Shin Henshuu-ban) - 04v2 (1280x720 10bit EAC3) [4FDAC05D].mkv">\
<track type="General">\
<UniqueID>101921291201158003289115028951156208200</UniqueID>\
<VideoCount>1</VideoCount>\
<AudioCount>1</AudioCount>\
<TextCount>1</TextCount>\
<MenuCount>1</MenuCount>\
<FileExtension>mkv</FileExtension>\
<Format>Matroska</Format>\
<Format_Version>4</Format_Version>\
<FileSize>859294383</FileSize>\
<Duration>3100.224</Duration>\
<OverallBitRate>2217374</OverallBitRate>\
<FrameRate>23.976</FrameRate>\
<FrameCount>74331</FrameCount>\
<StreamSize>17099534</StreamSize>\
<IsStreamable>Yes</IsStreamable>\
<Title>Re:Zero kara Hajimeru Isekai Seikatsu: Shin Henshuu-ban - 04 - The Sound of Chains</Title>\
<Movie>Re:Zero kara Hajimeru Isekai Seikatsu: Shin Henshuu-ban - 04 - The Sound of Chains</Movie>\
<Encoded_Date>UTC 2020-02-09 04:32:46</Encoded_Date>\
<File_Modified_Date>UTC 2020-02-09 04:47:30</File_Modified_Date>\
<File_Modified_Date_Local>2020-02-09 04:47:30</File_Modified_Date_Local>\
<Encoded_Application>mkvmerge v37.0.0 (&apos;Leave It&apos;) 64-bit</Encoded_Application>\
<Encoded_Library>libebml v1.3.9 + libmatroska v1.5.2</Encoded_Library>\
<extra>\
<Attachments>ALDOTHEAPACHE.TTF / ARMEDBANANA.TTF / CRONOSPRO-BOLD.OTF / CRONOSPRO-BOLDIT.OTF / ACASLONPRO-BOLD.OTF / ACASLONPRO-BOLDITALIC.OTF</Attachments>\
</extra>\
</track>\
<track type="Video">\
<StreamOrder>0</StreamOrder>\
<ID>1</ID>\
<UniqueID>1</UniqueID>\
<Format>AVC</Format>\
<Format_Profile>High 4:4:4 Predictive</Format_Profile>\
<Format_Level>4</Format_Level>\
<Format_Settings_CABAC>Yes</Format_Settings_CABAC>\
<Format_Settings_RefFrames>8</Format_Settings_RefFrames>\
<CodecID>V_MPEG4/ISO/AVC</CodecID>\
<Duration>3100.225</Duration>\
<BitRate>1949248</BitRate>\
<Width>1280</Width>\
<Height>720</Height>\
<Sampled_Width>1280</Sampled_Width>\
<Sampled_Height>720</Sampled_Height>\
<PixelAspectRatio>1.000</PixelAspectRatio>\
<DisplayAspectRatio>1.778</DisplayAspectRatio>\
<FrameRate_Mode>CFR</FrameRate_Mode>\
<FrameRate>23.976</FrameRate>\
<FrameCount>74331</FrameCount>\
<ColorSpace>YUV</ColorSpace>\
<ChromaSubsampling>4:4:4</ChromaSubsampling>\
<BitDepth>10</BitDepth>\
<ScanType>Progressive</ScanType>\
<Delay>0.000</Delay>\
<StreamSize>755388577</StreamSize>\
<Encoded_Library>x264 - core 157 r2969 d4099dd</Encoded_Library>\
<Encoded_Library_Name>x264</Encoded_Library_Name>\
<Encoded_Library_Version>core 157 r2969 d4099dd</Encoded_Library_Version>\
<Encoded_Library_Settings>cabac=1 / ref=8 / deblock=1:0:0 / analyse=0x3:0x133 / me=umh / subme=10 / psy=1 / psy_rd=0.70:0.00 / mixed_ref=1 / me_range=24 / chroma_me=1 / trellis=2 / 8x8dct=1 / cqm=0 / deadzone=21,11 / fast_pskip=0 / chroma_qp_offset=-2 / threads=22 / lookahead_threads=3 / sliced_threads=0 / nr=0 / decimate=0 / interlaced=0 / bluray_compat=0 / constrained_intra=0 / bframes=8 / b_pyramid=2 / b_adapt=2 / b_bias=0 / direct=3 / weightb=1 / open_gop=0 / weightp=2 / keyint=480 / keyint_min=23 / scenecut=40 / intra_refresh=0 / rc_lookahead=48 / rc=crf / mbtree=1 / crf=16.0 / qcomp=0.70 / qpmin=0 / qpmax=51 / qpstep=4 / ip_ratio=1.40 / aq=3:0.70</Encoded_Library_Settings>\
<Language>en</Language>\
<Default>Yes</Default>\
<Forced>No</Forced>\
<colour_description_present>Yes</colour_description_present>\
<colour_description_present_Source>Stream</colour_description_present_Source>\
<colour_range>Limited</colour_range>\
<colour_range_Source>Stream</colour_range_Source>\
<colour_primaries_Source>Stream</colour_primaries_Source>\
<transfer_characteristics_Source>Stream</transfer_characteristics_Source>\
<matrix_coefficients>BT.709</matrix_coefficients>\
<matrix_coefficients_Source>Stream</matrix_coefficients_Source>\
</track>\
<track type="Audio">\
<StreamOrder>1</StreamOrder>\
<ID>2</ID>\
<UniqueID>4520661316685850978</UniqueID>\
<Format>E-AC-3</Format>\
<Format_Commercial_IfAny>Dolby Digital Plus</Format_Commercial_IfAny>\
<Format_Settings_Endianness>Big</Format_Settings_Endianness>\
<CodecID>A_EAC3</CodecID>\
<Duration>3100.224</Duration>\
<BitRate_Mode>CBR</BitRate_Mode>\
<BitRate>224000</BitRate>\
<Channels>5</Channels>\
<ChannelPositions>Front: L R</ChannelPositions>\
<ChannelLayout>L R</ChannelLayout>\
<SamplesPerFrame>1536</SamplesPerFrame>\
<SamplingRate>48000</SamplingRate>\
<SamplingCount>148810752</SamplingCount>\
<FrameRate>31.250</FrameRate>\
<Compression_Mode>Lossy</Compression_Mode>\
<Delay>0.000</Delay>\
<Delay_Source>Container</Delay_Source>\
<StreamSize>86806272</StreamSize>\
<StreamSize_Proportion>0.10102</StreamSize_Proportion>\
<Language>ja</Language>\
<ServiceKind>CM</ServiceKind>\
<Default>Yes</Default>\
<Forced>No</Forced>\
<extra>\
<bsid>16</bsid>\
<dialnorm>-31</dialnorm>\
<compr>-0.28</compr>\
<dsurmod>0</dsurmod>\
<acmod>2</acmod>\
<lfeon>0</lfeon>\
<dialnorm_Average>-31</dialnorm_Average>\
<dialnorm_Minimum>-31</dialnorm_Minimum>\
<compr_Average>-3.18</compr_Average>\
<compr_Minimum>-6.58</compr_Minimum>\
<compr_Maximum>-0.56</compr_Maximum>\
<compr_Count>137</compr_Count>\
</extra>\
</track>\
<track type="Text">\
<ID>3</ID>\
<UniqueID>3872413016257577775</UniqueID>\
<Format>ASS</Format>\
<CodecID>S_TEXT/ASS</CodecID>\
<Compression_Mode>Lossless</Compression_Mode>\
<Language>en</Language>\
<Default>Yes</Default>\
<Forced>No</Forced>\
</track>\
<track type="Menu">\
<extra>\
<_00_00_00_033>en:Intro</_00_00_00_033>\
<_00_00_42_930>en:OP</_00_00_42_930>\
<_00_02_12_900>en:Part A</_00_02_12_900>\
<_00_12_43_950>en:Part B</_00_12_43_950>\
<_00_24_55_890>en:Part C</_00_24_55_890>\
<_00_25_51_020>en:Part D</_00_25_51_020>\
<_00_35_05_910>en:Part E</_00_35_05_910>\
<_00_49_51_920>en:ED</_00_49_51_920>\
</extra>\
</track>\
</media>\
</MediaInfo>',
      // --------
      '<?xml version="1.0" encoding="UTF-8"?>\
<MediaInfo\
    xmlns="https://mediaarea.net/mediainfo"\
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\
    xsi:schemaLocation="https://mediaarea.net/mediainfo https://mediaarea.net/mediainfo/mediainfo_2_0.xsd"\
    version="2.0">\
<creatingLibrary version="19.09" url="https://mediaarea.net/MediaInfo">MediaInfoLib</creatingLibrary>\
<media ref="[HorribleSubs] ID INVADED - 07 [1080p].mkv">\
<track type="General">\
<UniqueID>0</UniqueID>\
<VideoCount>1</VideoCount>\
<AudioCount>1</AudioCount>\
<TextCount>1</TextCount>\
<FileExtension>mkv</FileExtension>\
<Format>Matroska</Format>\
<Format_Version>4</Format_Version>\
<FileSize>1474913027</FileSize>\
<Duration>1490.133</Duration>\
<OverallBitRate>7918289</OverallBitRate>\
<FrameRate>23.976</FrameRate>\
<FrameCount>35727</FrameCount>\
<IsStreamable>Yes</IsStreamable>\
<Encoded_Date>UTC 2010-02-22 21:41:29</Encoded_Date>\
<File_Modified_Date>UTC 2020-02-09 15:09:40</File_Modified_Date>\
<File_Modified_Date_Local>2020-02-09 15:09:40</File_Modified_Date_Local>\
<Encoded_Application>no_variable_data</Encoded_Application>\
<Encoded_Library>no_variable_data</Encoded_Library>\
<extra>\
<Attachments>OpenSans-Semibold.ttf</Attachments>\
</extra>\
</track>\
<track type="Video">\
<StreamOrder>0</StreamOrder>\
<ID>1</ID>\
<UniqueID>1</UniqueID>\
<Format>AVC</Format>\
<Format_Profile>High</Format_Profile>\
<Format_Level>4</Format_Level>\
<Format_Settings_CABAC>Yes</Format_Settings_CABAC>\
<Format_Settings_RefFrames>4</Format_Settings_RefFrames>\
<CodecID>V_MPEG4/ISO/AVC</CodecID>\
<Duration>1490.115</Duration>\
<BitRate_Nominal>8000000</BitRate_Nominal>\
<Width>1920</Width>\
<Height>1080</Height>\
<Stored_Height>1088</Stored_Height>\
<Sampled_Width>1920</Sampled_Width>\
<Sampled_Height>1080</Sampled_Height>\
<PixelAspectRatio>1.000</PixelAspectRatio>\
<DisplayAspectRatio>1.778</DisplayAspectRatio>\
<FrameRate_Mode>CFR</FrameRate_Mode>\
<FrameRate_Mode_Original>VFR</FrameRate_Mode_Original>\
<FrameRate>23.976</FrameRate>\
<FrameCount>35727</FrameCount>\
<ColorSpace>YUV</ColorSpace>\
<ChromaSubsampling>4:2:0</ChromaSubsampling>\
<BitDepth>8</BitDepth>\
<ScanType>Progressive</ScanType>\
<Delay>0.042</Delay>\
<Encoded_Library>x264 - core 157 r2948 dada181</Encoded_Library>\
<Encoded_Library_Name>x264</Encoded_Library_Name>\
<Encoded_Library_Version>core 157 r2948 dada181</Encoded_Library_Version>\
<Encoded_Library_Settings>cabac=1 / ref=1 / deblock=1:0:0 / analyse=0x3:0x113 / me=hex / subme=7 / psy=1 / psy_rd=1.00:0.00 / mixed_ref=0 / me_range=16 / chroma_me=1 / trellis=1 / 8x8dct=1 / cqm=0 / deadzone=21,11 / fast_pskip=1 / chroma_qp_offset=-2 / threads=24 / lookahead_threads=4 / sliced_threads=0 / nr=0 / decimate=1 / interlaced=0 / bluray_compat=0 / constrained_intra=0 / bframes=2 / b_pyramid=2 / b_adapt=1 / b_bias=0 / direct=1 / weightb=1 / open_gop=0 / weightp=2 / keyint=48 / keyint_min=4 / scenecut=40 / intra_refresh=0 / rc_lookahead=40 / rc=cbr / mbtree=1 / bitrate=8000 / ratetol=1.0 / qcomp=0.60 / qpmin=0 / qpmax=69 / qpstep=4 / vbv_maxrate=8000 / vbv_bufsize=24000 / nal_hrd=none / filler=0 / ip_ratio=1.40 / aq=1:1.00</Encoded_Library_Settings>\
<Default>Yes</Default>\
<Forced>No</Forced>\
<extra>\
<Statistics_Tags_Issue>no_variable_data 1970-01-01 00:00:00 / no_variable_data 2010-02-22 21:41:29</Statistics_Tags_Issue>\
<FromStats_BitRate>7661296</FromStats_BitRate>\
<FromStats_Duration>00:24:50.072000000</FromStats_Duration>\
<FromStats_FrameCount>35726</FromStats_FrameCount>\
<FromStats_StreamSize>1426985344</FromStats_StreamSize>\
</extra>\
</track>\
<track type="Audio">\
<StreamOrder>1</StreamOrder>\
<ID>2</ID>\
<UniqueID>2</UniqueID>\
<Format>AAC</Format>\
<Format_AdditionalFeatures>LC</Format_AdditionalFeatures>\
<CodecID>A_AAC-2</CodecID>\
<Duration>1490.133</Duration>\
<Channels>2</Channels>\
<ChannelPositions>Front: L R</ChannelPositions>\
<ChannelLayout>L R</ChannelLayout>\
<SamplesPerFrame>1024</SamplesPerFrame>\
<SamplingRate>48000</SamplingRate>\
<SamplingCount>71526384</SamplingCount>\
<FrameRate>46.875</FrameRate>\
<Compression_Mode>Lossy</Compression_Mode>\
<Delay>0.000</Delay>\
<Delay_Source>Container</Delay_Source>\
<Language>ja</Language>\
<Default>Yes</Default>\
<Forced>No</Forced>\
<extra>\
<Statistics_Tags_Issue>no_variable_data 1970-01-01 00:00:00 / no_variable_data 2010-02-22 21:41:29</Statistics_Tags_Issue>\
<FromStats_BitRate>253375</FromStats_BitRate>\
<FromStats_Duration>00:24:50.133000000</FromStats_Duration>\
<FromStats_FrameCount>69850</FromStats_FrameCount>\
<FromStats_StreamSize>47195317</FromStats_StreamSize>\
</extra>\
</track>\
<track type="Text">\
<ID>3</ID>\
<UniqueID>3</UniqueID>\
<Format>ASS</Format>\
<CodecID>S_TEXT/ASS</CodecID>\
<Compression_Mode>Lossless</Compression_Mode>\
<Language>en</Language>\
<Default>Yes</Default>\
<Forced>No</Forced>\
<extra>\
<Statistics_Tags_Issue>no_variable_data 1970-01-01 00:00:00 / no_variable_data 2010-02-22 21:41:29</Statistics_Tags_Issue>\
<FromStats_BitRate>116</FromStats_BitRate>\
<FromStats_Duration>00:23:07.040000000</FromStats_Duration>\
<FromStats_FrameCount>369</FromStats_FrameCount>\
<FromStats_StreamSize>20181</FromStats_StreamSize>\
</extra>\
</track>\
</media>\
</MediaInfo>',
      // --------
      '<?xml version="1.0" encoding="UTF-8"?>\
<MediaInfo\
    xmlns="https://mediaarea.net/mediainfo"\
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\
    xsi:schemaLocation="https://mediaarea.net/mediainfo https://mediaarea.net/mediainfo/mediainfo_2_0.xsd"\
    version="2.0">\
<creatingLibrary version="19.09" url="https://mediaarea.net/MediaInfo">MediaInfoLib</creatingLibrary>\
<media ref="[Coalgirls]_Eden_of_the_East_Movie_I_(1920x1080_Blu-Ray_FLAC)_[68AB2703].mkv">\
<track type="General">\
<UniqueID>186807111382072804417945047899077783780</UniqueID>\
<VideoCount>1</VideoCount>\
<AudioCount>2</AudioCount>\
<TextCount>2</TextCount>\
<MenuCount>1</MenuCount>\
<FileExtension>mkv</FileExtension>\
<Format>Matroska</Format>\
<Format_Version>2</Format_Version>\
<FileSize>3088505870</FileSize>\
<Duration>4871.910</Duration>\
<OverallBitRate_Mode>VBR</OverallBitRate_Mode>\
<OverallBitRate>5071532</OverallBitRate>\
<FrameRate>23.976</FrameRate>\
<FrameCount>116809</FrameCount>\
<IsStreamable>Yes</IsStreamable>\
<Title>Eden of the East Movie I</Title>\
<Movie>Eden of the East Movie I</Movie>\
<Encoded_Date>UTC 2011-04-29 20:47:29</Encoded_Date>\
<File_Created_Date>UTC 2019-06-14 20:12:04.215</File_Created_Date>\
<File_Created_Date_Local>2019-06-14 21:12:04.215</File_Created_Date_Local>\
<File_Modified_Date>UTC 2019-06-14 20:14:29.162</File_Modified_Date>\
<File_Modified_Date_Local>2019-06-14 21:14:29.162</File_Modified_Date_Local>\
<Encoded_Application>mkvmerge v4.4.0 (&apos;Die Wiederkehr&apos;) built on Oct 31 2010 21:52:48</Encoded_Application>\
<Encoded_Library>libebml v1.0.0 + libmatroska v1.0.0</Encoded_Library>\
<extra>\
<Attachments>AbsaraSans-Medium.otf / arial.ttf / CascadeScriptLTStdPL.ttf / Century_Holic.ttf / chinacatthin.ttf / CooperBlackStd.otf / Du766Bd_.ttf / Eager_Naturalist.ttf / fansubBlock.ttf / FILOBOLD.TTF / FrancophilSans.ttf / georgia.ttf / GOTHIC.TTF / JAPAB_.ttf / LT_0.ttf / LT_70142.ttf / LT_70142_mod.ttf</Attachments>\
</extra>\
</track>\
<track type="Video">\
<StreamOrder>0</StreamOrder>\
<ID>1</ID>\
<UniqueID>2548588947</UniqueID>\
<Format>AVC</Format>\
<Format_Profile>High</Format_Profile>\
<Format_Level>5.1</Format_Level>\
<Format_Settings_CABAC>Yes</Format_Settings_CABAC>\
<Format_Settings_RefFrames>16</Format_Settings_RefFrames>\
<CodecID>V_MPEG4/ISO/AVC</CodecID>\
<Duration>4871.914</Duration>\
<Width>1920</Width>\
<Height>1080</Height>\
<Stored_Height>1088</Stored_Height>\
<Sampled_Width>1920</Sampled_Width>\
<Sampled_Height>1080</Sampled_Height>\
<PixelAspectRatio>1.000</PixelAspectRatio>\
<DisplayAspectRatio>1.778</DisplayAspectRatio>\
<FrameRate_Mode>CFR</FrameRate_Mode>\
<FrameRate>23.976</FrameRate>\
<FrameCount>116809</FrameCount>\
<ColorSpace>YUV</ColorSpace>\
<ChromaSubsampling>4:2:0</ChromaSubsampling>\
<BitDepth>8</BitDepth>\
<ScanType>Progressive</ScanType>\
<Delay>0.000</Delay>\
<Title>Eden of the East Movie I</Title>\
<Encoded_Library>x264 - core 114 r1913 5fd3dce</Encoded_Library>\
<Encoded_Library_Name>x264</Encoded_Library_Name>\
<Encoded_Library_Version>core 114 r1913 5fd3dce</Encoded_Library_Version>\
<Encoded_Library_Settings>cabac=1 / ref=16 / deblock=1:0:0 / analyse=0x3:0x133 / me=umh / subme=10 / psy=1 / psy_rd=1.00:0.00 / mixed_ref=1 / me_range=24 / chroma_me=1 / trellis=2 / 8x8dct=1 / cqm=0 / deadzone=21,11 / fast_pskip=1 / chroma_qp_offset=-2 / threads=9 / sliced_threads=0 / nr=0 / decimate=1 / interlaced=0 / constrained_intra=0 / bframes=8 / b_pyramid=2 / b_adapt=2 / b_bias=0 / direct=3 / weightb=1 / open_gop=0 / weightp=2 / keyint=250 / keyint_min=23 / scenecut=40 / intra_refresh=0 / rc_lookahead=60 / rc=crf / mbtree=1 / crf=18.0 / qcomp=0.60 / qpmin=0 / qpmax=69 / qpstep=4 / ip_ratio=1.40 / aq=1:1.00</Encoded_Library_Settings>\
<Default>Yes</Default>\
<Forced>No</Forced>\
</track>\
<track type="Audio" typeorder="1">\
<StreamOrder>1</StreamOrder>\
<ID>2</ID>\
<UniqueID>2687881912</UniqueID>\
<Format>FLAC</Format>\
<CodecID>A_FLAC</CodecID>\
<Duration>4871.910</Duration>\
<BitRate_Mode>VBR</BitRate_Mode>\
<Channels>6</Channels>\
<ChannelPositions>Front: L C R, Side: L R, LFE</ChannelPositions>\
<ChannelLayout>L R C LFE Ls Rs</ChannelLayout>\
<SamplingRate>48000</SamplingRate>\
<SamplingCount>233851680</SamplingCount>\
<BitDepth>16</BitDepth>\
<BitDepth_Detected>16</BitDepth_Detected>\
<Compression_Mode>Lossless</Compression_Mode>\
<Delay>0.000</Delay>\
<Delay_Source>Container</Delay_Source>\
<Title>5.1 FLAC</Title>\
<Encoded_Library>reference libFLAC 1.2.1 20070917</Encoded_Library>\
<Encoded_Library_Name>libFLAC</Encoded_Library_Name>\
<Encoded_Library_Version>1.2.1</Encoded_Library_Version>\
<Encoded_Library_Date>UTC 2007-09-17</Encoded_Library_Date>\
<Language>ja</Language>\
<Default>Yes</Default>\
<Forced>No</Forced>\
</track>\
<track type="Audio" typeorder="2">\
<StreamOrder>2</StreamOrder>\
<ID>3</ID>\
<UniqueID>3627626415</UniqueID>\
<Format>FLAC</Format>\
<CodecID>A_FLAC</CodecID>\
<Duration>4871.910</Duration>\
<BitRate_Mode>VBR</BitRate_Mode>\
<Channels>6</Channels>\
<ChannelPositions>Front: L C R, Side: L R, LFE</ChannelPositions>\
<ChannelLayout>L R C LFE Ls Rs</ChannelLayout>\
<SamplingRate>48000</SamplingRate>\
<SamplingCount>233851680</SamplingCount>\
<BitDepth>16</BitDepth>\
<BitDepth_Detected>16</BitDepth_Detected>\
<Compression_Mode>Lossless</Compression_Mode>\
<Delay>0.000</Delay>\
<Delay_Source>Container</Delay_Source>\
<Title>5.1 FLAC</Title>\
<Encoded_Library>reference libFLAC 1.2.1 20070917</Encoded_Library>\
<Encoded_Library_Name>libFLAC</Encoded_Library_Name>\
<Encoded_Library_Version>1.2.1</Encoded_Library_Version>\
<Encoded_Library_Date>UTC 2007-09-17</Encoded_Library_Date>\
<Language>en</Language>\
<Default>No</Default>\
<Forced>No</Forced>\
</track>\
<track type="Text" typeorder="1">\
<ID>4</ID>\
<UniqueID>2939709080</UniqueID>\
<Format>ASS</Format>\
<CodecID>S_TEXT/ASS</CodecID>\
<Compression_Mode>Lossless</Compression_Mode>\
<Title>English</Title>\
<Language>en</Language>\
<Default>Yes</Default>\
<Forced>No</Forced>\
</track>\
<track type="Text" typeorder="2">\
<ID>5</ID>\
<UniqueID>2093989538</UniqueID>\
<Format>ASS</Format>\
<CodecID>S_TEXT/ASS</CodecID>\
<Compression_Mode>Lossless</Compression_Mode>\
<Title>Songs + Signs</Title>\
<Language>en</Language>\
<Default>No</Default>\
<Forced>No</Forced>\
</track>\
<track type="Menu">\
<extra>\
<_00_00_00_000>en:00:00:00.000</_00_00_00_000>\
<_00_05_15_524>en:00:05:15.524</_00_05_15_524>\
<_00_07_17_437>en:00:07:17.437</_00_07_17_437>\
<_00_13_57_962>en:00:13:57.962</_00_13_57_962>\
<_00_17_51_070>en:00:17:51.070</_00_17_51_070>\
<_00_23_07_219>en:00:23:07.219</_00_23_07_219>\
<_00_29_30_060>en:00:29:30.060</_00_29_30_060>\
<_00_32_32_701>en:00:32:32.701</_00_32_32_701>\
<_00_38_47_158>en:00:38:47.158</_00_38_47_158>\
<_00_44_14_318>en:00:44:14.318</_00_44_14_318>\
<_00_50_04_043>en:00:50:04.043</_00_50_04_043>\
<_00_54_58_462>en:00:54:58.462</_00_54_58_462>\
<_00_59_57_886>en:00:59:57.886</_00_59_57_886>\
<_01_05_44_732>en:01:05:44.732</_01_05_44_732>\
<_01_10_17_880>en:01:10:17.880</_01_10_17_880>\
<_01_16_44_600>en:01:16:44.600</_01_16_44_600>\
<_01_21_11_909>en:01:21:11.909</_01_21_11_909>\
</extra>\
</track>\
</media>\
</MediaInfo>',
      // --------
      '<?xml version="1.0" encoding="UTF-8"?>\
<MediaInfo\
    xmlns="https://mediaarea.net/mediainfo"\
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\
    xsi:schemaLocation="https://mediaarea.net/mediainfo https://mediaarea.net/mediainfo/mediainfo_2_0.xsd"\
    version="2.0">\
<creatingLibrary version="19.09" url="https://mediaarea.net/MediaInfo">MediaInfoLib</creatingLibrary>\
<media ref="[Doki] Zero no Tsukaima - Futatsuki no Kishi - 02 (1280x720 HEVC BD FLAC) [D7461089].mkv">\
<track type="General">\
<UniqueID>182687286970154998760982186696103391740</UniqueID>\
<VideoCount>1</VideoCount>\
<AudioCount>1</AudioCount>\
<TextCount>1</TextCount>\
<MenuCount>1</MenuCount>\
<FileExtension>mkv</FileExtension>\
<Format>Matroska</Format>\
<Format_Version>4</Format_Version>\
<FileSize>365302833</FileSize>\
<Duration>1421.005</Duration>\
<OverallBitRate_Mode>VBR</OverallBitRate_Mode>\
<OverallBitRate>2056589</OverallBitRate>\
<FrameRate>23.976</FrameRate>\
<FrameCount>34070</FrameCount>\
<IsStreamable>Yes</IsStreamable>\
<Title>[Doki] Zero no Tsukaima - Futatsuki no Kishi - 02 (1280x720 HEVC BD FLAC)</Title>\
<Movie>[Doki] Zero no Tsukaima - Futatsuki no Kishi - 02 (1280x720 HEVC BD FLAC)</Movie>\
<Encoded_Date>UTC 2014-12-14 14:59:35</Encoded_Date>\
<File_Created_Date>UTC 2019-05-17 10:45:34.182</File_Created_Date>\
<File_Created_Date_Local>2019-05-17 11:45:34.182</File_Created_Date_Local>\
<File_Modified_Date>UTC 2019-05-17 10:52:06.932</File_Modified_Date>\
<File_Modified_Date_Local>2019-05-17 11:52:06.932</File_Modified_Date_Local>\
<Encoded_Application>mkvmerge v7.4.0 (&apos;Circles&apos;) 64bit built on Dec 12 2014 12:19:56</Encoded_Application>\
<Encoded_Library>libebml v1.3.0 + libmatroska v1.4.1</Encoded_Library>\
<extra>\
<Attachments>ARLRDBD.TTF / AVGARDNEclipse.ttf / FRABK.TTF / kaiu.ttf / MTCORSVA.TTF / Vesta-Bold.otf</Attachments>\
</extra>\
</track>\
<track type="Video">\
<StreamOrder>0</StreamOrder>\
<ID>1</ID>\
<UniqueID>16423577727541039238</UniqueID>\
<Format>HEVC</Format>\
<CodecID>V_MPEGH/ISO/HEVC</CodecID>\
<Duration>1421.004</Duration>\
<Width>1280</Width>\
<Height>720</Height>\
<PixelAspectRatio>1.000</PixelAspectRatio>\
<DisplayAspectRatio>1.778</DisplayAspectRatio>\
<FrameRate_Mode>CFR</FrameRate_Mode>\
<FrameRate>23.976</FrameRate>\
<FrameCount>34070</FrameCount>\
<Delay>0.000</Delay>\
<Title>HEVC</Title>\
<Language>ja</Language>\
<Default>Yes</Default>\
<Forced>No</Forced>\
</track>\
<track type="Audio">\
<StreamOrder>1</StreamOrder>\
<ID>2</ID>\
<UniqueID>1007454608</UniqueID>\
<Format>FLAC</Format>\
<CodecID>A_FLAC</CodecID>\
<Duration>1421.005</Duration>\
<BitRate_Mode>VBR</BitRate_Mode>\
<Channels>2</Channels>\
<ChannelPositions>Front: L R</ChannelPositions>\
<ChannelLayout>L R</ChannelLayout>\
<SamplingRate>48000</SamplingRate>\
<SamplingCount>68208240</SamplingCount>\
<BitDepth>16</BitDepth>\
<BitDepth_Detected>16</BitDepth_Detected>\
<Compression_Mode>Lossless</Compression_Mode>\
<Delay>0.000</Delay>\
<Delay_Source>Container</Delay_Source>\
<Title>FLAC</Title>\
<Encoded_Library>reference libFLAC 1.2.1 20070917</Encoded_Library>\
<Encoded_Library_Name>libFLAC</Encoded_Library_Name>\
<Encoded_Library_Version>1.2.1</Encoded_Library_Version>\
<Encoded_Library_Date>UTC 2007-09-17</Encoded_Library_Date>\
<Language>ja</Language>\
<Default>Yes</Default>\
<Forced>No</Forced>\
</track>\
<track type="Text">\
<ID>3</ID>\
<UniqueID>766612124</UniqueID>\
<Format>ASS</Format>\
<CodecID>S_TEXT/ASS</CodecID>\
<Compression_Mode>Lossless</Compression_Mode>\
<Title>ASS (SS &amp; AYU)</Title>\
<Language>en</Language>\
<Default>Yes</Default>\
<Forced>No</Forced>\
</track>\
<track type="Menu">\
<extra>\
<_00_00_00_000>en:Prologue</_00_00_00_000>\
<_00_00_44_044>en:OP</_00_00_44_044>\
<_00_02_14_009>en:Part A</_00_02_14_009>\
<_00_10_38_012>en:Part B</_00_10_38_012>\
<_00_21_54_897>en:ED</_00_21_54_897>\
<_00_23_24_987>en:Preview</_00_23_24_987>\
</extra>\
</track>\
</media>\
</MediaInfo>',
      // --------
      '<?xml version="1.0" encoding="UTF-8"?>\
<MediaInfo\
    xmlns="https://mediaarea.net/mediainfo"\
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\
    xsi:schemaLocation="https://mediaarea.net/mediainfo https://mediaarea.net/mediainfo/mediainfo_2_0.xsd"\
    version="2.0">\
<creatingLibrary version="19.09" url="https://mediaarea.net/MediaInfo">MediaInfoLib</creatingLibrary>\
<media ref="[animeisdead] NO GAME NO LIFE - ZERO [BD 1080p h265 10-bit FLAC 5.1].mkv">\
<track type="General">\
<UniqueID>29635265233234598992585288046179078377</UniqueID>\
<VideoCount>1</VideoCount>\
<AudioCount>2</AudioCount>\
<TextCount>1</TextCount>\
<MenuCount>1</MenuCount>\
<FileExtension>mkv</FileExtension>\
<Format>Matroska</Format>\
<Format_Version>4</Format_Version>\
<FileSize>6791547325</FileSize>\
<Duration>6387.718</Duration>\
<OverallBitRate_Mode>VBR</OverallBitRate_Mode>\
<OverallBitRate>8505757</OverallBitRate>\
<FrameRate>23.976</FrameRate>\
<FrameCount>153152</FrameCount>\
<StreamSize>1777525</StreamSize>\
<IsStreamable>Yes</IsStreamable>\
<Title>映画『ノーゲーム・ノーライフ ゼロ』</Title>\
<Movie>映画『ノーゲーム・ノーライフ ゼロ』</Movie>\
<Encoded_Date>UTC 2018-02-24 07:21:58</Encoded_Date>\
<File_Created_Date>UTC 2019-05-17 13:08:19.870</File_Created_Date>\
<File_Created_Date_Local>2019-05-17 14:08:19.870</File_Created_Date_Local>\
<File_Modified_Date>UTC 2019-05-17 17:06:26.280</File_Modified_Date>\
<File_Modified_Date_Local>2019-05-17 18:06:26.280</File_Modified_Date_Local>\
<Encoded_Application>mkvmerge v20.0.0 (&apos;I Am The Sun&apos;) 64-bit</Encoded_Application>\
<Encoded_Library>libebml v1.3.5 + libmatroska v1.4.8 / Lavf58.9.100</Encoded_Library>\
<extra>\
<Attachments>FontinSans-Bold.ttf / FontinSans-BoldItalic.ttf</Attachments>\
</extra>\
</track>\
<track type="Video">\
<StreamOrder>0</StreamOrder>\
<ID>1</ID>\
<UniqueID>1</UniqueID>\
<Format>HEVC</Format>\
<Format_Profile>Main 10</Format_Profile>\
<Format_Level>4</Format_Level>\
<Format_Tier>Main</Format_Tier>\
<CodecID>V_MPEGH/ISO/HEVC</CodecID>\
<Duration>6387.715000000</Duration>\
<BitRate>4225338</BitRate>\
<Width>1920</Width>\
<Height>1080</Height>\
<Sampled_Width>1920</Sampled_Width>\
<Sampled_Height>1080</Sampled_Height>\
<PixelAspectRatio>1.000</PixelAspectRatio>\
<DisplayAspectRatio>1.778</DisplayAspectRatio>\
<FrameRate_Mode>CFR</FrameRate_Mode>\
<FrameRate>23.976</FrameRate>\
<FrameCount>153152</FrameCount>\
<ColorSpace>YUV</ColorSpace>\
<ChromaSubsampling>4:2:0</ChromaSubsampling>\
<BitDepth>10</BitDepth>\
<Delay>0.000</Delay>\
<StreamSize>3373781935</StreamSize>\
<Title>h265 10-bit</Title>\
<Encoded_Library>x265 - 2.6:[Linux][GCC 7.2.1][64 bit] 10bit</Encoded_Library>\
<Encoded_Library_Name>x265</Encoded_Library_Name>\
<Encoded_Library_Version>2.6:[Linux][GCC 7.2.1][64 bit] 10bit</Encoded_Library_Version>\
<Encoded_Library_Settings>cpuid=1173503 / frame-threads=2 / wpp / no-pmode / no-pme / no-psnr / no-ssim / log-level=2 / input-csp=1 / input-res=1920x1080 / interlace=0 / total-frames=0 / level-idc=0 / high-tier=1 / uhd-bd=0 / ref=3 / no-allow-non-conformance / no-repeat-headers / annexb / no-aud / no-hrd / info / hash=0 / no-temporal-layers / open-gop / min-keyint=23 / keyint=250 / bframes=4 / b-adapt=2 / b-pyramid / bframe-bias=0 / rc-lookahead=20 / lookahead-slices=6 / scenecut=40 / no-intra-refresh / ctu=64 / min-cu-size=8 / no-rect / no-amp / max-tu-size=32 / tu-inter-depth=1 / tu-intra-depth=1 / limit-tu=0 / rdoq-level=0 / dynamic-rd=0.00 / no-ssim-rd / signhide / no-tskip / nr-intra=0 / nr-inter=0 / no-constrained-intra / strong-intra-smoothing / max-merge=2 / limit-refs=3 / no-limit-modes / me=1 / subme=2 / merange=57 / temporal-mvp / weightp / no-weightb / no-analyze-src-pics / deblock=0:0 / sao / no-sao-non-deblock / rd=3 / no-early-skip / rskip / no-fast-intra / no-tskip-fast / no-cu-lossless / no-b-intra / no-splitrd-skip / rdpenalty=0 / psy-rd=2.00 / psy-rdoq=0.00 / no-rd-refine / analysis-reuse-mode=0 / no-lossless / cbqpoffs=0 / crqpoffs=0 / rc=crf / crf=16.0 / qcomp=0.60 / qpstep=4 / stats-write=0 / stats-read=0 / ipratio=1.40 / pbratio=1.30 / aq-mode=1 / aq-strength=1.00 / cutree / zone-count=0 / no-strict-cbr / qg-size=32 / no-rc-grain / qpmax=69 / qpmin=0 / no-const-vbv / sar=1 / overscan=0 / videoformat=5 / range=0 / colorprim=2 / transfer=2 / colormatrix=2 / chromaloc=0 / display-window=0 / max-cll=0,0 / min-luma=0 / max-luma=1023 / log2-max-poc-lsb=8 / vui-timing-info / vui-hrd-info / slices=1 / no-opt-qp-pps / no-opt-ref-list-length-pps / no-multi-pass-opt-rps / scenecut-bias=0.05 / no-opt-cu-delta-qp / no-aq-motion / no-hdr / no-hdr-opt / no-dhdr10-opt / analysis-reuse-level=5 / scale-factor=0 / refine-intra=0 / refine-inter=0 / refine-mv=0 / no-limit-sao / ctu-info=0 / no-lowpass-dct / refine-mv-type=0 / copy-pic=1</Encoded_Library_Settings>\
<Language>ja</Language>\
<Default>No</Default>\
<Forced>No</Forced>\
</track>\
<track type="Audio" typeorder="1">\
<StreamOrder>1</StreamOrder>\
<ID>2</ID>\
<UniqueID>2</UniqueID>\
<Format>FLAC</Format>\
<CodecID>A_FLAC</CodecID>\
<Duration>6387.718000000</Duration>\
<BitRate_Mode>VBR</BitRate_Mode>\
<BitRate>3111295</BitRate>\
<Channels>6</Channels>\
<ChannelPositions>Front: L C R, Side: L R, LFE</ChannelPositions>\
<ChannelLayout>L R C LFE Ls Rs</ChannelLayout>\
<SamplesPerFrame>4608</SamplesPerFrame>\
<SamplingRate>48000</SamplingRate>\
<SamplingCount>306610464</SamplingCount>\
<FrameRate>10.417</FrameRate>\
<FrameCount>66539</FrameCount>\
<BitDepth>24</BitDepth>\
<Compression_Mode>Lossless</Compression_Mode>\
<Delay>0.000</Delay>\
<Delay_Source>Container</Delay_Source>\
<StreamSize>2484259762</StreamSize>\
<StreamSize_Proportion>0.36579</StreamSize_Proportion>\
<Title>FLAC 5.1, 24-bit</Title>\
<Encoded_Library>Lavc58.11.101 flac</Encoded_Library>\
<Language>ja</Language>\
<Default>Yes</Default>\
<Forced>No</Forced>\
</track>\
<track type="Audio" typeorder="2">\
<StreamOrder>2</StreamOrder>\
<ID>3</ID>\
<UniqueID>15761256034071324384</UniqueID>\
<Format>FLAC</Format>\
<CodecID>A_FLAC</CodecID>\
<Duration>6387.718000000</Duration>\
<BitRate_Mode>VBR</BitRate_Mode>\
<BitRate>1166783</BitRate>\
<Channels>2</Channels>\
<ChannelPositions>Front: L R</ChannelPositions>\
<ChannelLayout>L R</ChannelLayout>\
<SamplesPerFrame>4608</SamplesPerFrame>\
<SamplingRate>48000</SamplingRate>\
<SamplingCount>306610464</SamplingCount>\
<FrameRate>10.417</FrameRate>\
<FrameCount>66539</FrameCount>\
<BitDepth>24</BitDepth>\
<Compression_Mode>Lossless</Compression_Mode>\
<Delay>0.000</Delay>\
<Delay_Source>Container</Delay_Source>\
<StreamSize>931635780</StreamSize>\
<StreamSize_Proportion>0.13718</StreamSize_Proportion>\
<Title>Commentary, FLAC 2.0, 24-bit</Title>\
<Encoded_Library>Lavf58.9.100</Encoded_Library>\
<Language>ja</Language>\
<Default>No</Default>\
<Forced>No</Forced>\
</track>\
<track type="Text">\
<ID>4</ID>\
<UniqueID>3501858249147161012</UniqueID>\
<Format>ASS</Format>\
<CodecID>S_TEXT/ASS</CodecID>\
<Duration>6311.100000000</Duration>\
<BitRate>117</BitRate>\
<FrameRate>0.253</FrameRate>\
<FrameCount>1599</FrameCount>\
<ElementCount>1599</ElementCount>\
<Compression_Mode>Lossless</Compression_Mode>\
<StreamSize>92323</StreamSize>\
<Title>English</Title>\
<Language>en</Language>\
<Default>Yes</Default>\
<Forced>No</Forced>\
</track>\
<track type="Menu">\
<extra>\
<_00_00_00_000>:Chapter 01</_00_00_00_000>\
<_00_05_01_426>:Chapter 02</_00_05_01_426>\
<_00_13_27_264>:Chapter 03</_00_13_27_264>\
<_00_33_18_955>:Chapter 04</_00_33_18_955>\
<_00_38_03_447>:Chapter 05</_00_38_03_447>\
<_00_44_23_285>:Chapter 06</_00_44_23_285>\
<_00_58_42_519>:Chapter 07</_00_58_42_519>\
<_01_04_49_635>:Chapter 08</_01_04_49_635>\
<_01_13_05_214>:Chapter 09</_01_13_05_214>\
<_01_19_51_536>:Chapter 10</_01_19_51_536>\
<_01_24_56_049>:Chapter 11</_01_24_56_049>\
<_01_33_25_850>:Chapter 12</_01_33_25_850>\
<_01_38_44_793>:Chapter 13</_01_38_44_793>\
<_01_41_11_565>:Chapter 14</_01_41_11_565>\
<_01_46_20_332>:Chapter 15</_01_46_20_332>\
</extra>\
</track>\
</media>\
</MediaInfo>'
    ];

    it("should parse video codec", async function() {
      var result = await parseXml(infos[0]);
      expect(result.codec).toEqual('h264 10-bit');

      result = await parseXml(infos[1]);
      expect(result.codec).toEqual('h264');

      result = await parseXml(infos[2]);
      expect(result.codec).toEqual('h264');

      result = await parseXml(infos[3]);
      expect(result.codec).toEqual('h265');

      result = await parseXml(infos[4]);
      expect(result.codec).toEqual('h265 10-bit');
    });
    it("should parse audio codec", async function() {
      var result = await parseXml(infos[0]);
      expect(result.audio).toEqual('AC3');

      result = await parseXml(infos[1]);
      expect(result.audio).toEqual('AAC');

      result = await parseXml(infos[2]);
      expect(result.audio).toEqual('FLAC');

      result = await parseXml(infos[3]);
      expect(result.audio).toEqual('FLAC');

      result = await parseXml(infos[4]);
      expect(result.audio).toEqual('FLAC');
    });
    it("should parse audio channels", async function() {
      var result = await parseXml(infos[0]);
      expect(result.audiochannels).toEqual('5.0');

      result = await parseXml(infos[1]);
      expect(result.audiochannels).toEqual('2.0');

      result = await parseXml(infos[2]);
      expect(result.audiochannels).toEqual('5.1');

      result = await parseXml(infos[3]);
      expect(result.audiochannels).toEqual('2.0');

      // todo: handle multiple audio tracks properly
      //result = await parseXml(infos[4]);
      //expect(result.audiochannels).toEqual('5.1');
    });
  });
});
