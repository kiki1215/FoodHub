package com.foodhub.menu.config;

import com.foodhub.menu.entity.Category;
import com.foodhub.menu.entity.Product;
import com.foodhub.menu.entity.ProductStatus;
import com.foodhub.menu.repository.CategoryRepository;
import com.foodhub.menu.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Component
public class MenuDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(MenuDataSeeder.class);

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public MenuDataSeeder(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (categoryRepository.count() > 0 || productRepository.count() > 0) {
            log.info("Dữ liệu danh mục / món ăn đã tồn tại trong menu_db, bỏ qua khởi tạo dữ liệu mẫu.");
            return;
        }

        Category com = saveCategory("Cơm", "Các món cơm văn phòng, cơm tấm và cơm chiên đậm đà hương vị Việt.");
        Category phoMi = saveCategory("Phở và mì", "Phở bò, bún chả, bún bò Huế và các món mì nóng hổi.");
        Category fastFood = saveCategory("Đồ ăn nhanh", "Bánh mì giòn rụm, gà rán và burger tiện lợi cho mọi bữa ăn.");
        Category snack = saveCategory("Đồ ăn vặt", "Các món ăn vặt giòn ngon phù hợp cho buổi chiều và tụ tập bạn bè.");
        Category dessert = saveCategory("Tráng miệng", "Bánh ngọt, flan và chè mát lạnh tráng miệng sau bữa ăn.");
        Category drinks = saveCategory("Đồ uống", "Trà trái cây thanh mát, cà phê đậm vị và thức uống giải khát.");

        List<Product> sampleProducts = List.of(
                buildProduct("Cơm gà xối mỡ",
                        "Đùi gà góc tư chiên giòn da, thịt mềm mọng ăn kèm cơm đỏ chiên tỏi, dưa leo và nước mắm tỏi ớt.",
                        55000, "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800", com, 185L, "LUNCH"),
                buildProduct("Cơm tấm sườn bì chả",
                        "Sườn cốt lết nướng mật ong thơm lừng, bì thính, chả trứng hấp và nước mắm chua ngọt đặc trưng Sài Gòn.",
                        60000, "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800", com, 240L, "LUNCH"),
                buildProduct("Cơm chiên hải sản",
                        "Cơm chiên hạt tơi vàng ươm cùng tôm tươi, mực giòn, đậu Hà Lan và trứng gà.",
                        65000, "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800", com, 128L, "DINNER"),

                buildProduct("Phở bò đặc biệt",
                        "Nước dùng ninh xương bò 12 giờ thơm mùi hồi quế, đầy đủ thịt tái, nạm, gầu, bò viên và rau thơm.",
                        65000, "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800", phoMi, 310L, "MORNING"),
                buildProduct("Bún chả Hà Nội",
                        "Chả viên và ba chỉ nướng than hoa thơm nức, ăn kèm bún tươi, rau sống và nước chấm đu đủ giòn.",
                        55000, "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800", phoMi, 195L, "LUNCH"),
                buildProduct("Bún bò Huế",
                        "Nước dùng cay nhẹ đậm đà sả mắm ruốc, giò heo mềm, thịt bắp bò và chả cua chuẩn vị cố đô.",
                        60000, "https://images.unsplash.com/photo-1555126634-323283e090fa?w=800", phoMi, 220L, "MORNING"),
                buildProduct("Mì Ý sốt bò bằm",
                        "Sợi mì Spaghetti dai ngon quyện cùng sốt cà chua thịt bò bằm hầm mềm và phô mai Parmesan.",
                        75000, "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800", phoMi, 142L, "DINNER"),

                buildProduct("Bánh mì đặc biệt",
                        "Bánh mì vỏ giòn nhân pate gan béo ngậy, thịt nguội, chả lụa, đồ chua và sốt bơ trứng nhà làm.",
                        35000, "https://images.unsplash.com/photo-1600688640154-9619e002df30?w=800", fastFood, 275L, "MORNING"),
                buildProduct("Gà rán giòn cay",
                        "2 miếng gà tẩm bột giòn rụm bên ngoài, mọng nước bên trong, kèm tương ớt và tương cà.",
                        68000, "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800", fastFood, 210L, "DINNER"),
                buildProduct("Burger bò phô mai",
                        "Thịt bò Úc nướng lửa hồng, phô mai Cheddar tan chảy, rau xà lách tươi và sốt đặc biệt.",
                        72000, "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800", fastFood, 156L, "AFTERNOON"),

                buildProduct("Khoai tây chiên lắc phô mai",
                        "Khoai tây cắt sợi chiên vàng giòn, lắc đều cùng bột phô mai mặn ngọt béo thơm.",
                        35000, "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800", snack, 168L, "AFTERNOON"),
                buildProduct("Nem chua rán Hà Nội",
                        "Phần 8 chiếc nem chua rán tẩm xù vàng rụm, ăn kèm dưa chuột và tương ớt cay nồng.",
                        40000, "https://images.unsplash.com/photo-1544025162-d76694265947?w=800", snack, 134L, "AFTERNOON"),

                buildProduct("Bánh flan caramel",
                        "Bánh flan trứng sữa mềm mịn tan ngay trong miệng, phủ lớp caramel đắng nhẹ và cà phê.",
                        25000, "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800", dessert, 148L, "ALL_DAY"),
                buildProduct("Chè khúc bạch nhãn nhục",
                        "Khúc bạch phô mai béo ngậy kết hợp hạnh nhân lát rang thơm và nước đường nhãn nhục thanh mát.",
                        38000, "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800", dessert, 119L, "AFTERNOON"),

                buildProduct("Trà đào cam sả",
                        "Trà đen ủ thơm kết hợp miếng đào giòn ngọt, lát cam vàng tươi và hương sả dịu nhẹ giải nhiệt.",
                        35000, "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800", drinks, 295L, "ALL_DAY"),
                buildProduct("Cà phê sữa đá Sài Gòn",
                        "Cà phê phin rang xay nguyên chất hòa quyện sữa đặc béo ngậy, tỉnh táo cho ngày mới.",
                        29000, "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800", drinks, 260L, "MORNING")
        );

        productRepository.saveAll(sampleProducts);
        log.info("Đã khởi tạo thành công 6 danh mục và {} món ăn mẫu trong menu_db.", sampleProducts.size());
    }

    private Category saveCategory(String name, String description) {
        Category c = new Category();
        c.setName(name);
        c.setDescription(description);
        return categoryRepository.save(c);
    }

    private Product buildProduct(String name, String description, long priceVnd, String imageUrl,
                                 Category category, long soldCount, String mealTimeTag) {
        Product p = new Product();
        p.setName(name);
        p.setDescription(description);
        p.setPrice(BigDecimal.valueOf(priceVnd));
        p.setImageUrl(imageUrl);
        p.setCategory(category);
        p.setStatus(ProductStatus.AVAILABLE);
        p.setSoldCount(soldCount);
        p.setMealTimeTag(mealTimeTag);
        return p;
    }
}
