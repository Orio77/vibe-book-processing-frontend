sed -i '/private Chapter chapter;/i \
    @com.fasterxml.jackson.annotation.JsonIgnore\
' ../book-processing/src/main/java/com/orio/book_processing/processing/ChapterSummary.java
