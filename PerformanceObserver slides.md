# My Fonts Journey

* Just say no
* Etsy gig
* A book!
* Chapter 2: Fallbacks

<br><br><br><br><br><br><br><br><br>

# Old School

* Font trains

```css
font-family: CustomFont,
             -apple-system, BlinkMacSystemFont,
             "Segoe UI", "Noto Sans",
             Helvetica, Arial, sans-serif;
```

<br><br><br><br><br><br><br><br><br>

# Matching

* Monica Dinculescu's [Font Style Matcher](https://meowni.ca/font-style-matcher/)
* Targeting elements, not fonts
* Needs a class like `.font-is-loaded` otherwise tweaking both
* And an update to every type of text
  (e.g. different `line-height`s)

<br><br><br><br><br><br><br><br><br>

# New School

* Font fallback, not a text/element 

```css
@font-face {
  font-family: fallback;
  src: local("Arial");
  /* more font descriptors */
}
```

<br><br><br><br><br><br><br><br><br>

# 4 font descriptors

* `ascent-override`, `descent-override`, `line-gap-override`
* `size-adjust`

<br><br><br><br><br><br><br><br><br>

# Font metrics

<img src="https://developer.chrome.com/static/blog/font-fallbacks/image/diagram-depicting-fonts-35b0a9a1a618f_1920.png" width="400" />

* Tools: [wakamaifondue.com](https://wakamaifondue.com/), [fontdrop.info](https://fontdrop.info/)

<br><br><br><br><br><br><br><br><br>

# Size-adjust

* Proportional stretch

<img src="https://developer.chrome.com/static/blog/font-fallbacks/image/diagram-showing-results-1dda89a6fa84f_1920.png" width="400" />

<br><br><br><br><br><br><br><br><br>

# Strategy

* Use `size-adjust` for width
* Use the other three to correct the height

<br><br><br><br><br><br><br><br><br>

# Tools

* [Brian Louis Ramirez'](https://screenspan.net/fallback)
* [Malte Ubl's](https://www.industrialempathy.com/perfect-ish-font-fallback/?font=Montserrat), [another](https://deploy-preview-15--upbeat-shirley-608546.netlify.app/perfect-ish-font-fallback/?font=Metal)
* [Nuxt](https://github.com/nuxt-modules/fontaine)

<br><br><br><br><br><br><br><br><br>

# Overall plan

1. Take a web font and Arial
2. Render text
3. Change a descriptor`++`
4. Measure
5. Repeat until measurements match

<br><br><br><br><br><br><br><br><br>

# Why Arial?

* Even Arial is not guaranteed
* [modernfontstacks.com](https://modernfontstacks.com/)
* Pick more that one!💡

```css
font-family: Custom Font, MacFallback, WindowsFallback...
```

<br><br><br><br><br><br><br><br><br>

# What text to render?

* Not Lorem Ipsum
* Based on [frequency of letters](https://www.phpied.com/the-zebra-jumps-quickly-over-a-fence-vexed-by-a-lazy-ox/)

<br><br><br><br><br><br><br><br><br>

# Which descriptors?

* Read 3 descriptors from the font metadata
* Measure `size-adjust`
* Tweak `ascender` and `descender`

<br><br><br><br><br><br><br><br><br>

# Fafofal demo

* [Fabulous Font Fallbacks](https://highperformancewebfonts.com/tools/fafofal/)

<br><br><br><br><br><br><br><br><br>

# The bad news

* Safari: only `size-adjust`
* Only as perfect as the measured text
* Not all fonts available to `local()`
* Using the tool on the target OS 

<br><br><br><br><br><br><br><br><br>

# Web-safe fonts?

```css
font-family: system-ui, sans-serif;
```

<br><br><br><br><br><br><br><br><br>

# Fonts and Performance

* Mandy Michael perfnow [talk](https://www.youtube.com/watch?v=P4378iO4oBI) and [resources](https://github.com/mandymichael/font-performance-resources)
* Paul Calvano NYWebPerf [talk](https://github.com/mandymichael/font-performance-resources)
* [https://highperformancewebfonts.com](https://highperformancewebfonts.com)
 
